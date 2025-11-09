import React from 'react';
import { Star } from 'lucide-react';

export default function RatingStars({ rating, onRate, readonly = false, size = 'md', showCount = false, count = 0 }) {
	const sizeClasses = {
		sm: 'w-4 h-4',
		md: 'w-6 h-6',
		lg: 'w-8 h-8'
	};

	const starSize = sizeClasses[size] || sizeClasses.md;

	return (
		<div className="flex items-center gap-1">
			{[1, 2, 3, 4, 5].map((star) => (
				<button
					key={star}
					type="button"
					disabled={readonly}
					onClick={() => !readonly && onRate && onRate(star)}
					className={`transition-all ${!readonly ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
				>
					<Star
						className={`${starSize} ${
							star <= rating
								? 'fill-yellow-400 text-yellow-400'
								: 'fill-gray-200 text-gray-300'
						} transition-colors`}
					/>
				</button>
			))}
			{showCount && count > 0 && (
				<span className="ml-2 text-sm text-gray-600">
					({count} {count === 1 ? 'review' : 'reviews'})
				</span>
			)}
		</div>
	);
}