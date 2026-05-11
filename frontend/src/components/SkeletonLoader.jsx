import React from "react";

/**
 * SkeletonCard — animated shimmer placeholder
 * Props: width, height, borderRadius, style
 */
export function SkeletonBox({ width = "100%", height = 16, borderRadius = 6, style = {} }) {
  return (
    <div
      className="skeleton-box"
      style={{ width, height, borderRadius, ...style }}
    />
  );
}

export function SkeletonMetricCard() {
  return (
    <div className="card">
      <div className="metric-card-header">
        <div style={{ flex: 1 }}>
          <SkeletonBox width={90} height={11} style={{ marginBottom: 10 }} />
          <SkeletonBox width={52} height={28} style={{ marginBottom: 8 }} />
          <SkeletonBox width={70} height={11} />
        </div>
        <SkeletonBox width={36} height={36} borderRadius={8} />
      </div>
    </div>
  );
}

export function SkeletonTableRow() {
  return (
    <tr>
      {[70, 80, 120, 90, 70, 70, 55].map((w, i) => (
        <td key={i} style={{ padding: "14px 16px" }}>
          <SkeletonBox width={w} height={13} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonCard({ lines = 3, height = 120 }) {
  return (
    <div className="card" style={{ height }}>
      <SkeletonBox width={100} height={12} style={{ marginBottom: 16 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBox
          key={i}
          width={i % 2 === 0 ? "85%" : "65%"}
          height={11}
          style={{ marginBottom: 10 }}
        />
      ))}
    </div>
  );
}
