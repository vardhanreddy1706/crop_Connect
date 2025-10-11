// src/pages/help/FaqPrices.jsx
import React from "react";
import HelpLayout from "./HelpLayout.jsx";


export default function HelpFaqPrices() {
	return (
		<HelpLayout title="FAQ – Crop Prices">
			<section className="space-y-6">
				<div>
					<h2 className="text-lg font-semibold">Data Source</h2>
					<p>
						Prices are fetched from public datasets and normalized for display.
					</p>
				</div>

				<div>
					<h2 className="text-lg font-semibold">Update Frequency</h2>
					<p>
						Updates depend on the source’s refresh cadence; the app shows the
						latest available records.
					</p>
				</div>

				<div>
					<h2 className="text-lg font-semibold">Meaning of Min/Max/Modal</h2>
					<ul className="list-disc pl-6">
						<li>Min: lowest reported price for the day.</li>
						<li>Max: highest reported price for the day.</li>
						<li>Modal: most commonly traded price (median-like).</li>
					</ul>
				</div>

				<div>
					<h2 className="text-lg font-semibold">Markets and Coverage</h2>
					<p>
						Coverage varies by state/district; not all commodities are available
						for all markets.
					</p>
				</div>

				<div>
					<h2 className="text-lg font-semibold">
						Troubleshooting Missing Data
					</h2>
					<ul className="list-disc pl-6">
						<li>Try a broader search (only commodity or only state).</li>
						<li>Check again later if the data source is delayed.</li>
					</ul>
				</div>
			</section>
		</HelpLayout>
	);
}
