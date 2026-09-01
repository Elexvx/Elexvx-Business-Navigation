import {
  GithubOutlined,
  GlobalOutlined,
  LinkOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { AutoComplete, Button, Empty, Input, Select, Space, Typography } from 'antd';
import { useMemo, useRef, useState } from 'react';

import { siteConfig } from '../../config/site';
import { flattenNavigationLinks } from '../../lib/navigation';
import {
  buildSearchUrl,
  getEnabledSearchEngines,
  getPreferredSearchEngine,
  isSearchScope,
  openExternalUrl,
  SEARCH_ENGINE_STORAGE_KEY,
  SEARCH_SCOPE_STORAGE_KEY,
  readStoredValue,
  searchNavigationLinks,
  writeStoredValue,
} from '../../lib/search';
import type { NavigationLink, SearchEngine, SearchScope } from '../../types/site';
import styles from './SearchPanel.module.css';

const INTERNAL_SOURCE = 'internal';

function readInitialScope(): SearchScope {
  const storedScope = readStoredValue(SEARCH_SCOPE_STORAGE_KEY);
  return isSearchScope(storedScope) ? storedScope : 'internal';
}

function readInitialEngine(searchEngines: SearchEngine[]): SearchEngine | undefined {
  const storedEngine = readStoredValue(SEARCH_ENGINE_STORAGE_KEY);
  return (
    searchEngines.find((engine) => engine.id === storedEngine) ??
    searchEngines.find((engine) => engine.id === siteConfig.search.defaultEngine) ??
    searchEngines[0]
  );
}

function getSearchEngineIcon(engine: SearchEngine): React.ReactNode {
  return engine.id === 'github' ? <GithubOutlined /> : <GlobalOutlined />;
}

function getLinkSearchOption(link: NavigationLink): { value: string; label: React.ReactNode } {
  return {
    value: link.id,
    label: (
      <div className={styles.suggestion}>
        <span className={styles.suggestionIcon} aria-hidden="true">
          <SearchOutlined />
        </span>
        <span className={styles.suggestionContent}>
          <Typography.Text strong ellipsis>
            {link.name}
          </Typography.Text>
          <Typography.Text type="secondary" ellipsis>
            {link.description || '打开链接'}
          </Typography.Text>
        </span>
      </div>
    ),
  };
}

export function SearchPanel() {
  const links = useMemo(() => flattenNavigationLinks(siteConfig.navigation), []);
  const enabledEngines = useMemo(() => getEnabledSearchEngines(siteConfig.search), []);
  const [scope, setScope] = useState<SearchScope>(readInitialScope);
  const [query, setQuery] = useState('');
  const [engine, setEngine] = useState<SearchEngine | undefined>(() =>
    readInitialEngine(enabledEngines),
  );
  const selectionHandledRef = useRef(false);
  const selectionResetTimerRef = useRef<number | undefined>(undefined);

  const suggestions = useMemo(
    () => searchNavigationLinks(links, query, siteConfig.search.maxSuggestions),
    [links, query],
  );

  const selectedEngine = engine ?? getPreferredSearchEngine(siteConfig.search);
  const selectedSource = scope === 'internal' ? INTERNAL_SOURCE : selectedEngine?.id;

  const sourceOptions = useMemo(
    () => [
      {
        value: INTERNAL_SOURCE,
        label: (
          <span className={styles.engineOption}>
            <LinkOutlined aria-hidden="true" />
            <span>站内导航</span>
          </span>
        ),
      },
      ...enabledEngines.map((candidate) => ({
        value: candidate.id,
        label: (
          <span className={styles.engineOption}>
            <span aria-hidden="true">{getSearchEngineIcon(candidate)}</span>
            <span>{candidate.displayName}</span>
          </span>
        ),
      })),
    ],
    [enabledEngines],
  );

  const handleSourceChange = (source: string) => {
    if (source === INTERNAL_SOURCE) {
      setScope('internal');
      writeStoredValue(SEARCH_SCOPE_STORAGE_KEY, 'internal');
      return;
    }

    const nextEngine = enabledEngines.find((candidate) => candidate.id === source);
    if (!nextEngine) return;

    setScope('web');
    setEngine(nextEngine);
    writeStoredValue(SEARCH_SCOPE_STORAGE_KEY, 'web');
    writeStoredValue(SEARCH_ENGINE_STORAGE_KEY, nextEngine.id);
  };

  const openInternalResult = (link: NavigationLink) => {
    setQuery(link.name);
    openExternalUrl(link.url);
  };

  const handleInternalSelect = (linkId: string) => {
    const selectedLink = links.find((link) => link.id === linkId);
    if (!selectedLink) return;

    selectionHandledRef.current = true;
    window.clearTimeout(selectionResetTimerRef.current);
    selectionResetTimerRef.current = window.setTimeout(() => {
      selectionHandledRef.current = false;
    }, 100);
    openInternalResult(selectedLink);
  };

  const findInternalResult = (searchQuery: string, matches: NavigationLink[]) => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase('zh-CN');
    if (!normalizedQuery) return;

    const exactMatch = links.find(
      (link) => link.name.trim().toLocaleLowerCase('zh-CN') === normalizedQuery,
    );
    return exactMatch ?? matches[0];
  };

  const handleInternalSearch = () => {
    const firstMatch = findInternalResult(query, suggestions);
    if (firstMatch) openInternalResult(firstMatch);
  };

  const handleInternalEnter = () => {
    const queryAtEnter = query;
    const suggestionsAtEnter = suggestions;

    window.setTimeout(() => {
      if (selectionHandledRef.current) return;

      const firstMatch = findInternalResult(queryAtEnter, suggestionsAtEnter);
      if (firstMatch) openInternalResult(firstMatch);
    }, 0);
  };

  const handleWebSearch = () => {
    if (!selectedEngine) return;

    const searchUrl = buildSearchUrl(selectedEngine, query);
    if (searchUrl) openExternalUrl(searchUrl);
  };

  const handleSubmit = () => {
    if (scope === 'internal') {
      handleInternalSearch();
    } else {
      handleWebSearch();
    }
  };

  return (
    <div className={styles.panel} aria-label="搜索工具">
      <Space.Compact block className={styles.compact}>
        <Select
          aria-label="选择搜索源"
          className={styles.sourceSelect}
          onChange={handleSourceChange}
          options={sourceOptions}
          popupMatchSelectWidth={168}
          size="large"
          value={selectedSource}
        />

        {scope === 'internal' ? (
          <AutoComplete
            aria-label="站内搜索"
            className={styles.searchControl}
            notFoundContent={query.trim()
              ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无匹配链接" />
              : null}
            onChange={setQuery}
            onSearch={setQuery}
            onSelect={handleInternalSelect}
            options={suggestions.map(getLinkSearchOption)}
            value={query}
          >
            <Input
              aria-label="站内搜索"
              onPressEnter={handleInternalEnter}
              placeholder="搜索企业系统、政务服务或关键词"
              size="large"
            />
          </AutoComplete>
        ) : (
          <Input
            aria-label="全网搜索"
            className={styles.searchControl}
            onChange={(event) => setQuery(event.target.value)}
            onPressEnter={handleWebSearch}
            placeholder="搜索企业系统、政务服务或关键词"
            size="large"
            value={query}
          />
        )}

        <Button
          aria-label="执行搜索"
          className={styles.searchButton}
          icon={<SearchOutlined />}
          onClick={handleSubmit}
          size="large"
          type="primary"
        >
          <span className={styles.searchButtonLabel}>搜索</span>
        </Button>
      </Space.Compact>
    </div>
  );
}
