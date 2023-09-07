import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ComingSoon: React.FC = () => {
  return (
    <div className="flex items-center justify-center">
      <div className="p-8 prose">
        <h1 className="mb-4 font-semibold">Coming Soon</h1>
        <p className="mb-8">
          We are working hard to bring you something amazing!
        </p>
        <div className="flex space-x-4">
          <Input type="email" placeholder="Please enter your email" />
          <Button>Subscribe</Button>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
