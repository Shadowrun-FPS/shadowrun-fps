import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type ComingSoonProps = {
  title: string;
  description: string;
};

const ComingSoon: React.FC<ComingSoonProps> = ({ title, description }) => {
  return (
    <div className="flex items-center justify-center">
      <div className="p-8 prose dark:prose-invert">
        <h1 className="mb-4 font-semibold">Coming Soon</h1>
        <h3>{title}</h3>
        <p className="mb-8">{description}</p>
        <div className="flex space-x-4">
          <Button asChild>
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
