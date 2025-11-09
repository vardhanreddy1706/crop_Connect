import React from "react";
import { Bell, X } from "lucide-react";
import { useNotificationContext } from "../context/NotificationContext";

export const NotificationBell = () => {
	const { notifications, unreadCount, markAsRead, deleteNotif, markAllAsRead } =
		useNotificationContext();
	const [showDropdown, setShowDropdown] = React.useState(false);

	return (
		<div className="relative">
			<button
				onClick={() => setShowDropdown(!showDropdown)}
				className="relative p-2 text-white bg-gray-800 hover:bg-gray-100 hover:text-red-600 rounded-lg transition"
			>
				<Bell className="w-6 h-6" />
				{unreadCount > 0 && (
					<span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
						{unreadCount}
					</span>
				)}
			</button>

			{showDropdown && (
				<div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
					<div className="p-4 border-b border-gray-200 flex items-center justify-between">
						<h3 className="font-bold text-gray-900">Notifications</h3>
						{unreadCount > 0 && (
							<button
								onClick={markAllAsRead}
								className="text-xs text-blue-600 hover:text-blue-800 font-medium"
							>
								Mark all as read
							</button>
						)}
					</div>

					<div className="max-h-96 overflow-y-auto">
						{notifications.length === 0 ? (
							<div className="p-4 text-center text-gray-500">
								No notifications
							</div>
						) : (
							notifications.map((notif) => (
								<div
									key={notif._id}
									className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition ${
										!notif.read ? "bg-blue-50" : ""
									}`}
								>
									<div className="flex items-start justify-between gap-2">
										<div className="flex-1">
											<p className="font-medium text-gray-900 text-sm">
												{notif.title}
											</p>
											<p className="text-xs text-gray-600 mt-1">
												{notif.message}
											</p>
											<p className="text-xs text-gray-400 mt-2">
												{new Date(notif.createdAt).toLocaleDateString()}
											</p>
										</div>
										<div className="flex items-center gap-1">
											{!notif.read && (
												<button
													onClick={() => markAsRead(notif._id)}
													className="text-blue-600 hover:text-blue-800 text-xs"
												>
													Mark as read
												</button>
											)}
											<button
												onClick={() => deleteNotif(notif._id)}
												className="text-gray-400 hover:text-gray-600"
											>
												<X className="w-4 h-4" />
											</button>
										</div>
									</div>
								</div>
							))
						)}
					</div>
				</div>
			)}
		</div>
	);
};
