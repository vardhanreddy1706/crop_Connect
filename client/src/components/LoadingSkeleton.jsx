import React from "react";

const shimmer = "animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700";

export const SkeletonCard = ({ className = "" }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 ${className}`}>
    <div className={`h-48 ${shimmer} rounded-md mb-4`}></div>
    <div className={`h-6 ${shimmer} rounded w-3/4 mb-2`}></div>
    <div className={`h-4 ${shimmer} rounded w-full mb-2`}></div>
    <div className={`h-4 ${shimmer} rounded w-2/3`}></div>
  </div>
);

export const SkeletonList = ({ count = 5 }) => (
  <div className="space-y-3">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className={`h-16 w-16 ${shimmer} rounded-full flex-shrink-0`}></div>
        <div className="flex-1 space-y-2">
          <div className={`h-4 ${shimmer} rounded w-3/4`}></div>
          <div className={`h-3 ${shimmer} rounded w-1/2`}></div>
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 4 }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
    <table className="min-w-full">
      <thead className="bg-gray-50 dark:bg-gray-700">
        <tr>
          {[...Array(cols)].map((_, i) => (
            <th key={i} className="px-6 py-3">
              <div className={`h-4 ${shimmer} rounded w-full`}></div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {[...Array(rows)].map((_, rowIndex) => (
          <tr key={rowIndex} className="border-t dark:border-gray-700">
            {[...Array(cols)].map((_, colIndex) => (
              <td key={colIndex} className="px-6 py-4">
                <div className={`h-4 ${shimmer} rounded w-full`}></div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const SkeletonGrid = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(count)].map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export default { SkeletonCard, SkeletonList, SkeletonTable, SkeletonGrid };
