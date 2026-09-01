import {
  AppstoreOutlined,
  AuditOutlined,
  BankOutlined,
  PartitionOutlined,
  RightOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Card, Empty, Image, Typography } from 'antd';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { siteConfig } from '../../config/site';
import type { NavigationCategory, NavigationLink } from '../../types/site';
import styles from './NavigationDashboard.module.css';

const CATEGORY_ICONS: Record<string, ReactNode> = {
  企业系统: <AppstoreOutlined />,
  政务链接: <BankOutlined />,
  知识产权: <SafetyCertificateOutlined />,
  企业信用: <AuditOutlined />,
  人工智能: <RobotOutlined />,
  公众平台: <TeamOutlined />,
};

function LinkIcon({ link }: { link: NavigationLink }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (!link.icon || imageFailed) {
    return (
      <span className={styles.iconFallback} role="img" aria-label={`${link.name}图标`}>
        <PartitionOutlined />
      </span>
    );
  }

  return (
    <Image
      className={styles.linkIcon}
      src={link.icon}
      alt={`${link.name}图标`}
      width={48}
      height={48}
      preview={false}
      fallback="/favicon-32x32.png"
      onError={() => setImageFailed(true)}
    />
  );
}

function DirectoryRow({ link }: { link: NavigationLink }) {
  return (
    <a
      className={styles.linkRow}
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className={styles.linkIconFrame}>
        <LinkIcon link={link} />
      </span>
      <span className={styles.linkBody}>
        <Typography.Text className={styles.linkTitle} strong ellipsis={{ tooltip: link.name }}>
          {link.name}
        </Typography.Text>
        <Typography.Text className={styles.description} type="secondary" ellipsis>
          {link.description || '打开链接'}
        </Typography.Text>
      </span>
      <RightOutlined className={styles.rowArrow} aria-hidden="true" />
    </a>
  );
}

function DirectoryGrid({ links }: { links: NavigationLink[] }) {
  if (links.length === 0) return null;

  return (
    <Card className={styles.directoryCard} size="small" styles={{ body: { padding: 0 } }}>
      <div className={styles.directoryGrid}>
        {links.map((link) => (
          <DirectoryRow key={link.id} link={link} />
        ))}
      </div>
    </Card>
  );
}

function NavigationSection({ category }: { category: NavigationCategory }) {
  const entryCount = countCategoryLinks(category);

  return (
    <section
      id={`category-${category.id}`}
      className={styles.categorySection}
      aria-labelledby={`heading-${category.id}`}
    >
      <div className={styles.categoryHeading}>
        <span className={styles.categoryIcon} aria-hidden="true">
          {CATEGORY_ICONS[category.category] ?? <AppstoreOutlined />}
        </span>
        <Typography.Title id={`heading-${category.id}`} level={2} className={styles.categoryTitle}>
          {category.category}
        </Typography.Title>
        <span className={styles.categoryCount} aria-label={`${entryCount} 个入口`}>
          {entryCount}
        </span>
      </div>

      <DirectoryGrid links={category.links} />

      {category.subcategories.map((subcategory) => (
        <div className={styles.subcategory} id={`subcategory-${subcategory.id}`} key={subcategory.id}>
          <Typography.Title level={3} className={styles.subcategoryTitle}>
            {subcategory.name}
          </Typography.Title>
          <DirectoryGrid links={subcategory.links} />
        </div>
      ))}
    </section>
  );
}

function countCategoryLinks(category: NavigationCategory): number {
  return category.links.length + category.subcategories.reduce(
    (total, subcategory) => total + subcategory.links.length,
    0,
  );
}

export function NavigationDashboard() {
  const { navigation } = siteConfig;

  return (
    <div className={styles.dashboard}>
      {navigation.length > 0 ? (
        <div className={styles.categories}>
          {navigation.map((category) => (
            <NavigationSection key={category.id} category={category} />
          ))}
        </div>
      ) : (
        <Card>
          <Empty description="暂无导航内容" />
        </Card>
      )}
    </div>
  );
}
