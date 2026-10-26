import React from "react";
import {
  Card,
  Flex,
  Text,
  IconButton,
} from "@radix-ui/themes";
import type { LiveData, Record } from "../types/LiveData";
import Flag from "./Flag";
import { useTranslation } from "react-i18next";
import Tips from "./ui/tips";

import { formatBytes } from "@/utils/unitHelper";

/** 格式化秒*/
export function formatUptime(seconds: number, t: TFunction): string {
  if (!seconds || seconds < 0) return t("nodeCard.time_second", { val: 0 });
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d) parts.push(`${d} ${t("nodeCard.time_day")}`);
  if (h) parts.push(`${h} ${t("nodeCard.time_hour")}`);
  if (m) parts.push(`${m} ${t("nodeCard.time_minute")}`);
  if (s || parts.length === 0) parts.push(`${s} ${t("nodeCard.time_second")}`);
  return parts.join(" ");
}

interface NodeProps {
  basic: NodeBasicInfo;
  live: Record | undefined;
  online: boolean;
  isMobile: boolean;
  showIpTagsInCard: boolean;
}
const DEFAULT_NODE_LIVE = {
  cpu: { usage: 0 },
  ram: { used: 0 },
  swap: { used: 0 },
  load: { load1: 0, load5: 0, load15: 0 },
  disk: { used: 0 },
  network: { up: 0, down: 0, totalUp: 0, totalDown: 0 },
  connections: { tcp: 0, udp: 0 },
  uptime: 0,
  process: 0,
  message: "",
  updated_at: "",
} as Record;

type MetricTone = "sky" | "moss" | "clay" | "plum";

const TONE_ICON: { [K in MetricTone]: React.ReactNode } = {
  sky: <Cpu size={13} strokeWidth={2.2} />,
  moss: <MemoryStick size={13} strokeWidth={2.2} />,
  clay: <HardDrive size={13} strokeWidth={2.2} />,
  plum: <Activity size={13} strokeWidth={2.2} />,
};

function MetricCell({
  tone,
  label,
  value,
  detail,
}: {
  tone: MetricTone;
  label: string;
  value: number;
  detail?: string;
}) {
  const pct = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  const level = pct >= 95 ? "critical" : pct >= 80 ? "high" : pct >= 60 ? "warn" : "ok";
  return (
    <div className={`km-metric km-tone-${tone}`}>
      <div className="km-metric-head">
        <span className="km-metric-icon">{TONE_ICON[tone]}</span>
        <span className="km-metric-label">{label}</span>
        <span className={`km-metric-value km-level-${level}`}>{pct.toFixed(1)}%</span>
      </div>
      <div className="km-metric-bar">
        <div className={`km-metric-fill km-level-${level}`} style={{ width: `${pct}%` }} />
      </div>
      {detail && <div className="km-metric-detail">{detail}</div>}
    </div>
  );
}

const Node = React.memo(
  ({ basic, live, online, isMobile, showIpTagsInCard }: NodeProps) => {
  const [t] = useTranslation();
  const liveData = live || DEFAULT_NODE_LIVE;

  const memoryUsagePercent = basic.mem_total
    ? (liveData.ram.used / basic.mem_total) * 100
    : 0;
  const diskUsagePercent = basic.disk_total
    ? (liveData.disk.used / basic.disk_total) * 100
    : 0;

  const uploadSpeed = formatBytes(liveData.network.up);
  const downloadSpeed = formatBytes(liveData.network.down);
  const totalUpload = formatBytes(liveData.network.totalUp);
  const totalDownload = formatBytes(liveData.network.totalDown);
  //const totalTraffic = formatBytes(liveData.network.totalUp + liveData.network.totalDown);
  return (
    <Card
      style={{
        width: "100%",
        margin: "0 auto",
        transition: "all 0.2s ease-in-out",
      }}
      id={basic.uuid}
      className="km-node-card node-card hover:cursor-pointer"
    >
      <Flex direction="column" gap="2">
        <Flex justify="between" align="center" gap="2">
          <Flex align="center" gap="2" style={{ minWidth: 0, flex: 1 }}>
            <span className={`km-status-dot ${online ? "is-online" : "is-offline"}`} />
            <Link to={`/instance/${basic.uuid}`} style={{ minWidth: 0 }}>
              <Text
                className="km-node-name"
                weight="bold"
                size={isMobile ? "2" : "3"}
                truncate
                style={{ maxWidth: "100%" }}
              >
                {basic.name}
              </Text>
            </Link>
          </Flex>
          <Flex align="center" gap="2" style={{ flex: "none" }}>
            {live?.message && <Tips color="#CE282E">{live.message}</Tips>}
            <MiniPingChartFloat
              uuid={basic.uuid}
              hours={24}
              trigger={
                <IconButton
                  variant="ghost"
                  size="1"
                  title={t("nodeCard.chart", "Chart")}
                  aria-label={t("nodeCard.chart", "Chart")}
                >
                  <TrendingUp size="14" />
                </IconButton>
              }
            />
            <Flag flag={basic.region} />
          </Flex>
        </Flex>

        <Flex align="center" gap="2" wrap="wrap">
          <span className={`km-uptime-pill ${online ? "" : "is-offline"}`}>
            {online
              ? `${t("nodeCard.online")} ${formatUptime(liveData.uptime, t)}`
              : t("nodeCard.offline")}
          </span>
          <PriceTags
            hidden={isMobile}
            price={basic.price}
            billing_cycle={basic.billing_cycle}
            expired_at={basic.expired_at}
            currency={basic.currency}
            tags={basic.tags}
            ip4={showIpTagsInCard ? basic.ipv4 : undefined}
            ip6={showIpTagsInCard ? basic.ipv6 : undefined}
          />
        </Flex>

        <div className="km-metric-grid">
          <MetricCell
            tone="sky"
            label={t("admin.nodeDetail.cpu")}
            value={liveData.cpu.usage}
            detail={`${(liveData.load?.load1 ?? 0).toFixed(2)} / ${(
              liveData.load?.load5 ?? 0
            ).toFixed(2)} / ${(liveData.load?.load15 ?? 0).toFixed(2)}`}
          />
          <MetricCell
            tone="moss"
            label={t("nodeCard.ram")}
            value={memoryUsagePercent}
            detail={`${formatBytes(liveData.ram.used)} / ${formatBytes(
              basic.mem_total,
            )}`}
          />
          <MetricCell
            tone="clay"
            label={t("nodeCard.disk")}
            value={diskUsagePercent}
            detail={`${formatBytes(liveData.disk.used)} / ${formatBytes(
              basic.disk_total,
            )}`}
          />
          <MetricCell
            tone="plum"
            label={t("nodeCard.totalTraffic")}
            value={
              basic.traffic_limit > 0
                ? getTrafficPercentage(
                    liveData.network.totalUp,
                    liveData.network.totalDown,
                    basic.traffic_limit,
                    basic.traffic_limit_type ?? "sum",
                  )
                : 0
            }
            detail={
              basic.traffic_limit > 0
                ? `↑ ${totalUpload} / ${formatBytes(basic.traffic_limit)}`
                : `↑ ${totalUpload} ↓ ${totalDownload}`
            }
          />
        </div>

        <div className="km-tile-row">
          <div className="km-tile">
            <span className="km-tile-label">{t("nodeCard.networkSpeed")}</span>
            <span className="km-tile-line km-up">
              <ArrowUp size={11} strokeWidth={2.6} /> {uploadSpeed}/s
            </span>
            <span className="km-tile-line km-down">
              <ArrowDown size={11} strokeWidth={2.6} /> {downloadSpeed}/s
            </span>
          </div>
          <div className="km-tile">
            <span className="km-tile-label">{t("nodeCard.totalTraffic")}</span>
            <span className="km-tile-line km-up">
              <ArrowUp size={11} strokeWidth={2.6} /> {totalUpload}
            </span>
            <span className="km-tile-line km-down">
              <ArrowDown size={11} strokeWidth={2.6} /> {totalDownload}
            </span>
          </div>
          <div className="km-tile">
            <span className="km-tile-label">{t("nodeCard.load")}</span>
            <span className="km-tile-line">
              {(liveData.load?.load1 ?? 0).toFixed(2)}
            </span>
            <span className="km-tile-line km-muted">
              {(liveData.load?.load5 ?? 0).toFixed(2)} /{" "}
              {(liveData.load?.load15 ?? 0).toFixed(2)}
            </span>
          </div>
        </div>

        <Flex justify="between" align="center" className="km-conn-row">
          <Text size="1" color="gray">
            {t("nodeCard.connections")}
          </Text>
          <Text size="1">
            TCP {liveData.connections?.tcp ?? 0} · UDP{" "}
            {liveData.connections?.udp ?? 0} · {t("nodeCard.process")}{" "}
            {liveData.process ?? 0}
          </Text>
        </Flex>

        <PriceTags
          hidden={!isMobile}
          price={basic.price}
          billing_cycle={basic.billing_cycle}
          expired_at={basic.expired_at}
          currency={basic.currency}
          tags={basic.tags || ""}
        />
      </Flex>
    </Card>
  );
});

export default Node;

type NodeGridProps = {
  nodes: NodeBasicInfo[];
  liveData: LiveData;
  onlineSet: ReadonlySet<string>;
};

import { Box } from "@radix-ui/themes";
import type { TFunction } from "i18next";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import type { NodeBasicInfo } from "@/contexts/NodeListContext";
import PriceTags from "./PriceTags";
import {
  TrendingUp,
  Cpu,
  MemoryStick,
  HardDrive,
  Activity,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import MiniPingChartFloat from "./MiniPingChartFloat";
import { usePublicInfo } from "@/contexts/PublicInfoContext";
export const NodeGrid = ({ nodes, liveData, onlineSet }: NodeGridProps) => {
  const { publicInfo } = usePublicInfo();
  const isMobile = useIsMobile();
  const showIpTagsInCard = Boolean(
    publicInfo?.theme_settings?.showIpTagsInCard,
  );
  const offlineServerPosition =
    publicInfo?.theme_settings?.offlineServerPosition; // "First/Keep/Last"

  // 排序节点：先按权重排序，权重大的靠前，再根据用户设置排序
  const sortedNodes = React.useMemo(() => [...nodes].sort((a, b) => {
    const aIsOnline = onlineSet.has(a.uuid);
    const bIsOnline = onlineSet.has(b.uuid);

    if (offlineServerPosition === "First") {
      if (!aIsOnline && bIsOnline) return -1;
      if (aIsOnline && !bIsOnline) return 1;
    } else if (offlineServerPosition !== "Keep") {
      if (aIsOnline && !bIsOnline) return -1;
      if (!aIsOnline && bIsOnline) return 1;
    }
    return a.weight - b.weight;
  }), [nodes, offlineServerPosition, onlineSet]);

  return (
    <Box
      className="km-node-list gap-2 md:gap-4"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        padding: "1rem",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {sortedNodes.map((node) => {
        const isOnline = onlineSet.has(node.uuid);
        const nodeData = liveData.data[node.uuid];

        return (
          <Node
            key={node.uuid}
            basic={node}
            live={nodeData}
            online={isOnline}
            isMobile={isMobile}
            showIpTagsInCard={showIpTagsInCard}
          />
        );
      })}
    </Box>
  );
};

function getTrafficPercentage(
  totalUp: number,
  totalDown: number,
  limit: number,
  type: "max" | "min" | "sum" | "up" | "down",
) {
  if (limit === 0) return 0;
  switch (type) {
    case "max":
      return (Math.max(totalUp, totalDown) / limit) * 100;
    case "min":
      return (Math.min(totalUp, totalDown) / limit) * 100;
    case "sum":
      return ((totalUp + totalDown) / limit) * 100;
    case "up":
      return (totalUp / limit) * 100;
    case "down":
      return (totalDown / limit) * 100;
    default:
      return 0;
  }
}
