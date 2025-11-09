import React from "react";
import { PackageOpen, ShoppingCart, FileText, Users, Inbox, RefreshCw } from "lucide-react";

const EmptyState = ({ 
  icon: Icon = Inbox,
  title = "No data available",
  description = "There's nothing here yet.",
  action = null,
  className = ""
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-6 mb-4">
        <Icon className="w-16 h-16 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
        {description}
      </p>
      {action && action}
    </div>
  );
};

export const EmptyCrops = ({ onAdd }) => (
  <EmptyState
    icon={PackageOpen}
    title="No crops listed yet"
    description="Start by listing your first crop to reach buyers across the platform."
    action={
      onAdd && (
        <button onClick={onAdd} className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium">
          List Your First Crop
        </button>
      )
    }
  />
);

export const EmptyOrders = () => (
  <EmptyState
    icon={ShoppingCart}
    title="No orders yet"
    description="Your orders will appear here once you start buying from farmers."
  />
);

export const EmptyBookings = () => (
  <EmptyState
    icon={FileText}
    title="No bookings found"
    description="You don't have any bookings at the moment."
  />
);

export default EmptyState;
