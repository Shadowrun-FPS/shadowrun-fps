"use client";

import { FeatureGate } from "@/components/feature-gate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/navbar";

export default function ScrimmagePage() {
  return (
    <FeatureGate feature="scrimmage">
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container px-4 py-8 mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Scrimmage</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Coming soon...</p>
            </CardContent>
          </Card>
        </main>
      </div>
    </FeatureGate>
  );
}
