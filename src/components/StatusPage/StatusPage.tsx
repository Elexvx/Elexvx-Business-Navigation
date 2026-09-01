import {
  ArrowLeftOutlined,
  BellOutlined,
  CalendarOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ExportOutlined,
  LockOutlined,
  ReloadOutlined,
  WarningFilled,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Collapse,
  Empty,
  Form,
  Input,
  Modal,
  Result,
  Skeleton,
  Space,
  Tooltip,
  Typography,
} from 'antd';
import type { CollapseProps } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { statusHistoryHref, statusHomeHref } from '../../app/routes';
import { siteConfig } from '../../config/site';
import {
  availabilityTone,
  formatDay,
  formatPercent,
  formatStatusTime,
  groupStatusMonitors,
  monitorDisplayName,
  statusTone,
} from '../../lib/status';
import type { StatusGroup, StatusTone } from '../../lib/status';
import type { AvailabilityDay, StatusData, StatusMonitor } from '../../types/status';
import { useStatusData } from './useStatusData';
import styles from './StatusPage.module.css';

interface StatusPageProps {
  history?: boolean;
}

const statusText: Record<StatusTone, string> = {
  healthy: '正常运行',
  warning: '性能下降',
  error: '服务异常',
  unknown: '状态未知',
};

function StatusDot({ tone }: { tone: StatusTone }) {
  return <span className={`${styles.statusDot} ${styles[tone]}`} aria-hidden="true" />;
}

function AvailabilityStrip({ days, label }: { days: AvailabilityDay[]; label: string }) {
  return (
    <div
      className={styles.availabilityStrip}
      aria-label={`${label}最近 60 天可用性`}
      role="img"
    >
      {days.slice(-60).map((day) => (
        <Tooltip
          key={day.date}
          title={`${formatDay(day.date)} · 可用率 ${formatPercent(day.percent)}`}
        >
          <span
            aria-hidden="true"
            className={`${styles.availabilityBar} ${styles[availabilityTone(day.percent)]}`}
          />
        </Tooltip>
      ))}
    </div>
  );
}

function MonitorRow({ monitor }: { monitor: StatusMonitor }) {
  const tone = statusTone(monitor.status);
  return (
    <div className={styles.monitorRow}>
      <div className={styles.monitorIdentity}>
        <StatusDot tone={tone} />
        <div>
          <Typography.Text className={styles.monitorName} strong>
            {monitorDisplayName(monitor.name)}
          </Typography.Text>
          <Typography.Text className={styles.monitorMeta} type="secondary">
            {statusText[tone]} · {monitor.interval ? `${Math.round(monitor.interval / 60)} 分钟检测` : '自动检测'}
          </Typography.Text>
        </div>
      </div>
      <Typography.Text className={styles.monitorUptime} type="secondary">
        {formatPercent(monitor.percent)}
      </Typography.Text>
      {monitor.url ? (
        <Tooltip title="打开服务">
          <Button
            aria-label={`打开${monitorDisplayName(monitor.name)}`}
            href={monitor.url}
            icon={<ExportOutlined />}
            rel="noopener noreferrer"
            size="small"
            target="_blank"
            type="text"
          />
        </Tooltip>
      ) : null}
    </div>
  );
}

function GroupLabel({ group }: { group: StatusGroup }) {
  const tone = statusTone(group.status);
  return (
    <div className={styles.groupLabel}>
      <div className={styles.groupIdentity}>
        <StatusDot tone={tone} />
        <Typography.Text className={styles.groupName} strong>{group.name}</Typography.Text>
        <Typography.Text className={styles.groupCount} type="secondary">
          {group.monitors.length} 个组件
        </Typography.Text>
      </div>
      <AvailabilityStrip days={group.days} label={group.name} />
      <Typography.Text className={styles.groupUptime} type="secondary">
        {formatPercent(group.percent)}
      </Typography.Text>
    </div>
  );
}

function StatusSummary({ data }: { data: StatusData }) {
  const hasErrors = data.summary.error > 0;
  const hasUnknown = data.summary.unknown > 0;
  const unavailable = data.monitors.filter((monitor) => monitor.status === 8 || monitor.status === 9);
  const type = hasErrors ? 'warning' : hasUnknown ? 'info' : 'success';
  const title = hasErrors
    ? '部分系统出现异常'
    : hasUnknown
      ? '部分系统状态未知'
      : '所有系统运行正常';
  const icon = hasErrors
    ? <WarningFilled />
    : hasUnknown
      ? undefined
      : <CheckCircleFilled />;

  return (
    <Alert
      className={styles.overallStatus}
      description={(
        <div className={styles.statusSummaryDetails}>
          <span>最近更新：{formatStatusTime(data.timestamp)}</span>
          {unavailable.length > 0 ? (
            <span>
              受影响服务：{unavailable.map((monitor) => monitorDisplayName(monitor.name)).join('、')}。系统将持续检测恢复情况。
            </span>
          ) : null}
        </div>
      )}
      icon={icon}
      title={title}
      showIcon
      type={type}
    />
  );
}

function StatusPanel({ data }: { data: StatusData }) {
  const groups = useMemo(
    () => groupStatusMonitors(data.monitors, siteConfig.status.groups),
    [data.monitors],
  );
  const items: CollapseProps['items'] = groups.map((group) => ({
    key: group.id,
    label: <GroupLabel group={group} />,
    children: (
      <div className={styles.monitorList}>
        {group.monitors.map((monitor) => <MonitorRow key={monitor.id} monitor={monitor} />)}
      </div>
    ),
  }));

  return (
    <Card className={styles.systemCard} title="系统状态" styles={{ body: { padding: 0 } }}>
      <Collapse
        className={styles.statusCollapse}
        defaultActiveKey={groups[0] ? [groups[0].id] : []}
        expandIconPlacement="end"
        ghost
        items={items}
      />
    </Card>
  );
}

function StatusHistory({ data }: { data: StatusData }) {
  return (
    <Card className={styles.systemCard} title="历史可用性">
      <div className={styles.historyList}>
        {data.monitors.map((monitor) => (
          <section className={styles.historyRow} key={monitor.id}>
            <div className={styles.historyHeading}>
              <div className={styles.groupIdentity}>
                <StatusDot tone={statusTone(monitor.status)} />
                <Typography.Text strong>{monitorDisplayName(monitor.name)}</Typography.Text>
              </div>
              <Typography.Text type="secondary">{formatPercent(monitor.percent)}</Typography.Text>
            </div>
            <AvailabilityStrip days={monitor.days} label={monitorDisplayName(monitor.name)} />
          </section>
        ))}
      </div>
    </Card>
  );
}

function StatusLogin({ onLogin }: { onLogin: (password: string) => Promise<void> }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  return (
    <Card className={styles.loginCard}>
      <Space direction="vertical" size="large" className={styles.loginContent}>
        <LockOutlined className={styles.loginIcon} />
        <div>
          <Typography.Title level={3}>服务状态受保护</Typography.Title>
          <Typography.Paragraph type="secondary">请输入访问密码后查看监控数据。</Typography.Paragraph>
        </div>
        {error ? <Alert title={error} type="error" showIcon /> : null}
        <Form
          layout="vertical"
          onFinish={async ({ password }: { password: string }) => {
            setSubmitting(true);
            setError(undefined);
            try {
              await onLogin(password);
            } catch (loginError) {
              setError(loginError instanceof Error ? loginError.message : '登录失败');
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <Form.Item name="password" rules={[{ required: true, message: '请输入访问密码' }]}>
            <Input.Password autoComplete="current-password" placeholder="访问密码" />
          </Form.Item>
          <Button block htmlType="submit" loading={submitting} type="primary">登录</Button>
        </Form>
      </Space>
    </Card>
  );
}

function updateMetadata(history: boolean) {
  const title = history ? `历史记录｜${siteConfig.status.title}` : siteConfig.status.title;
  document.title = title;
  const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  description?.setAttribute('content', siteConfig.status.description);
  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  canonical?.setAttribute(
    'href',
    history ? `${siteConfig.status.url}/history` : `${siteConfig.status.url}/`,
  );
}

export default function StatusPage({ history = false }: StatusPageProps) {
  const { data, error, loading, refreshing, passwordRequired, login, refresh } = useStatusData();
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const hostname = window.location.hostname;

  useEffect(() => updateMetadata(history), [history]);

  return (
    <section className={styles.statusPage}>
      <div className={styles.statusMain}>
        <div className={styles.statusPageToolbar}>
          <div>
            <Typography.Title level={1}>
              {history ? '历史可用性' : '服务状态'}
            </Typography.Title>
            <Typography.Text type="secondary">
              {history ? '查看最近 60 天的服务运行记录' : '实时查看企业服务与项目服务运行情况'}
            </Typography.Text>
          </div>
          <Space>
            <Tooltip title="刷新状态">
              <Button
                aria-label="刷新状态"
                icon={<ReloadOutlined spin={refreshing} />}
                loading={refreshing}
                onClick={refresh}
                shape="circle"
                type="text"
              />
            </Tooltip>
            <Button icon={<BellOutlined />} onClick={() => setSubscribeOpen(true)}>订阅通知</Button>
          </Space>
        </div>
        {history ? (
          <div className={styles.historyBack}>
            <Button href={statusHomeHref(hostname)} icon={<ArrowLeftOutlined />} type="text">返回当前状态</Button>
          </div>
        ) : null}

        {loading ? (
          <Card className={styles.loadingCard}><Skeleton active paragraph={{ rows: 7 }} /></Card>
        ) : passwordRequired ? (
          <StatusLogin onLogin={login} />
        ) : error || !data ? (
          <Result
            className={styles.errorState}
            status="error"
            title="暂时无法获取服务状态"
            subTitle={error || '请稍后重试'}
            extra={<Button onClick={refresh} type="primary">重新加载</Button>}
          />
        ) : (
          <>
            {!history ? <StatusSummary data={data} /> : null}
            {history ? <StatusHistory data={data} /> : <StatusPanel data={data} />}
            {!history ? (
              <div className={styles.historyAction}>
                <Button href={statusHistoryHref(hostname)} icon={<CalendarOutlined />}>查看历史记录</Button>
              </div>
            ) : null}
          </>
        )}
      </div>

      <Modal
        centered
        footer={<Button onClick={() => setSubscribeOpen(false)} type="primary">知道了</Button>}
        onCancel={() => setSubscribeOpen(false)}
        open={subscribeOpen}
        title="订阅服务通知"
      >
        <Empty
          description="邮件与飞书订阅通道正在接入；当前页面会每 5 分钟自动刷新。"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Modal>
    </section>
  );
}
