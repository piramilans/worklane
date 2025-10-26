"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"

export function ChartAreaInteractive() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Progress</CardTitle>
        <CardDescription>
          Track your project completion over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full flex items-center justify-center bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-4xl font-bold text-muted-foreground mb-2">📊</div>
            <p className="text-muted-foreground">Chart visualization coming soon</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
