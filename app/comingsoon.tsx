// components/ComingSoon.tsx
import React from "react";

const ComingSoon: React.FC = () => {
  return (
    <div className="flex items-center justify-center">
      <div className="p-8 bg-white rounded-lg shadow-md">
        <h1 className="mb-4 text-3xl font-semibold text-gray-800">
          Coming Soon
        </h1>
        <p className="mb-8 text-gray-600">
          We are working hard to bring you something amazing!
        </p>
        <div className="flex space-x-4">
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
          <button className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:bg-blue-600">
            Subscribe
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
