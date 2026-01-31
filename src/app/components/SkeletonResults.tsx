import React from 'react';

const SkeletonResults = () => (
    <div className="w-full flex flex-col gap-6 animate-pulse">
        <div className="bg-gray-200 h-32 w-full rounded-xl"></div>
        <div className="flex gap-2">
            <div className="bg-gray-200 h-24 flex-1 rounded-xl"></div>
            <div className="bg-gray-200 h-24 flex-1 rounded-xl"></div>
        </div>
        <div className="bg-gray-200 h-64 w-full rounded-xl mt-4"></div>
    </div>
);

export default SkeletonResults;
