import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const farmerImages = [
	"/c1.jpeg",
	"/c2.jpeg",
	"/c3.jpeg",
	"/c4.jpeg",
	"/c5.jpeg",
	"/c6.jpeg",
	"/c7.jpeg",
	
];

export default function FarmerCarousel() {
	const settings = {
		dots: true,
		infinite: true,
		speed: 500,
		slidesToShow: 3,
		slidesToScroll: 1,
		autoplay: true,
		autoplaySpeed: 3000,
		arrows: true,
		responsive: [
			{ breakpoint: 1024, settings: { slidesToShow: 2 } },
			{ breakpoint: 640, settings: { slidesToShow: 1 } },
		],
	};

	return (
		<div className="max-w-7xl mx-auto px-4 py-10">
			<h2 className="text-2xl font-semibold mb-6">Farmer Working Images</h2>
			<Slider {...settings}>
				{farmerImages.map((img, idx) => (
					<div key={idx} className="px-2">
						<img
							src={img}
							alt={`Farmer working ${idx + 1}`}
							className="rounded-lg object-cover w-full h-48"
						/>
					</div>
				))}
			</Slider>
		</div>
	);
}
