import React from "react";
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
    speed: 600,
    slidesToShow: 3,
    slidesToScroll: 1,
    centerMode: true,            // important: enables centering
    centerPadding: "80px",       // visible neighbor cards — tuned below per breakpoint
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: true,
    adaptiveHeight: false,
    responsive: [
      {
        breakpoint: 1280,
        settings: {
          slidesToShow: 3,
          centerPadding: "60px",
        },
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          centerPadding: "80px",
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          centerPadding: "120px", // shows partial peek on both sides for mobile
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          centerPadding: "40px", // smaller peek on tiny phones
        },
      },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h2 className="text-2xl font-semibold mb-6">Farmer Working Images</h2>

      <Slider {...settings} className="farmer-carousel">
        {farmerImages.map((img, idx) => (
          <div key={idx} className="px-3 slide-wrap">
            <div className="relative overflow-hidden rounded-lg shadow-sm">
              {/* use a fixed aspect box so all images are same visual length */}
              <div className="aspect-[16/9] w-full bg-gray-100">
                <img
                  src={img}
                  alt={`Farmer working ${idx + 1}`}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                  draggable={false}
                />
              </div>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
}