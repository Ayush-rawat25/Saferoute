import React from "react";
import { CheckCircle, AlertTriangle } from "lucide-react";

// Utility to filter common locality names
function getCommonLocalities(names = []) {
  const termCount = {};
  const total = names.length;

  names.forEach((name) => {
    const parts = name.split(",").map((s) => s.trim().toLowerCase());
    new Set(parts).forEach((part) => {
      if (part.length > 3) {
        termCount[part] = (termCount[part] || 0) + 1;
      }
    });
  });

  const ignoredTerms = Object.entries(termCount)
    .filter(([_, count]) => count / total > 0.7)
    .map(([term]) => term);

  const meaningful = {};

  names.forEach((name) => {
    const parts = name.split(",").map((s) => s.trim().toLowerCase());
    parts.forEach((p) => {
      if (p.length > 3 && !ignoredTerms.includes(p)) {
        meaningful[p] = (meaningful[p] || 0) + 1;
      }
    });
  });

  return Object.entries(meaningful)
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .map(([term]) => term.replace(/\b\w/g, (l) => l.toUpperCase()));
}

export default function HeatmapWarnings({ affectedAreas = [], safetyScore }) {
  const hasRoute =
    (Array.isArray(affectedAreas) && affectedAreas.length > 0) ||
    (safetyScore !== null && safetyScore !== undefined);

  if (!hasRoute) return null;

  const highRiskLocalities = getCommonLocalities(
    affectedAreas.map((a) => a.name || "")
  );

  const scoreLabel =
    safetyScore >= 80
      ? "Excellent"
      : safetyScore >= 60
      ? "Good"
      : safetyScore >= 40
      ? "Moderate"
      : "Low";

  const scoreColor =
    safetyScore >= 80
      ? "text-green-600"
      : safetyScore >= 60
      ? "text-yellow-500"
      : safetyScore >= 40
      ? "text-orange-500"
      : "text-red-600";

  return (
    <div className="bg-green-50 border border-green-300 rounded-xl p-4 w-full shadow">
      <div className="flex items-center gap-2 mb-2">
        <CheckCircle className="text-green-600 w-5 h-5" />
        <h3 className="font-semibold text-gray-800 text-base">
          Safety Score:{" "}
          <span className={`font-bold ${scoreColor}`}>
            {safetyScore} ({scoreLabel})
          </span>
        </h3>
      </div>

      {/* High-risk Localities */}
      {highRiskLocalities.length > 0 && (
        <div className="text-sm text-black font-medium flex flex-wrap gap-x-3 gap-y-1">
          <span className="text-green-700">High-risk Areas:</span>
          {highRiskLocalities.map((loc, idx) => (
            <span key={idx} className="text-black">
              {loc}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
