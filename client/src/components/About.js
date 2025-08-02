import React from 'react';

const AboutUs = () => {
  return (
    <div div className="bg-indigo-200">
    <section className="max-w-5xl mx-auto px-6 py-12 font-sans text-gray-800">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-green-700">About SafeRoutes</h1>
        <p className="mt-3 text-lg text-gray-600">
          Empowering safer journeys for everyone, everywhere.
        </p>
      </div>

      {/* Mission */}
      <div className="bg-green-50 rounded-lg shadow p-6 mb-10">
        <h2 className="text-2xl font-semibold text-green-800 mb-3">Our Mission</h2>
        <p>
          At <span className="font-bold">SafeRoutes</span>, we believe that traveling from one point to another
          should never come with fear or uncertainty. Our mission is to help people
          navigate their cities safely by providing intelligent, real-time routing solutions.
        </p>
      </div>

      {/* Features */}
      <div className="bg-white rounded-lg shadow p-6 mb-10">
        <h2 className="text-2xl font-semibold text-green-800 mb-4">What We Offer</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <span className="font-semibold">Smart Route Analysis:</span> We evaluate all possible routes and
            highlight the <em>safer paths</em> based on real-time data.
          </li>
          <li>
            <span className="font-semibold">Safety Score Visualization:</span> Streets are color-coded to instantly
            show the safety level of each path.
          </li>
          <li>
            <span className="font-semibold">Call for Help:</span> In emergencies, instantly reach trusted contacts or
            authorities from within the app.
          </li>
          <li>
            <span className="font-semibold">Live Location Sharing:</span> Share your journey in real-time with family
            and friends for added peace of mind.
          </li>
          <li>
            <span className="font-semibold">Incident Reporting:</span> Help others stay safe by reporting accidents or
            suspicious activities in your area.
          </li>
        </ul>
      </div>

      {/* Why Section */}
      <div className="bg-green-50 rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold text-green-800 mb-3">Why SafeRoutes?</h2>
        <p>
          Whether walking home late at night, exploring a new city, or just wanting extra
          security on your daily commute, <span className="font-bold">SafeRoutes</span> is your companion for
          safe and stress-free travel.
        </p>
      </div>
    </section>
    </div>
  );
};

export default AboutUs;
