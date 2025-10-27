"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"

const data = [
  { id: 1, task: "Design new dashboard", project: "AAWS Demo Project", status: "In Progress", priority: "High" },
  { id: 2, task: "Implement user authentication", project: "AAWS Demo Project", status: "Completed", priority: "Medium" },
  { id: 3, task: "Setup database schema", project: "AAWS Demo Project", status: "Completed", priority: "High" },
  { id: 4, task: "Create API endpoints", project: "AAWS Demo Project", status: "In Progress", priority: "Medium" },
  { id: 5, task: "Write documentation", project: "AAWS Demo Project", status: "Pending", priority: "Low" },
]

export function DataTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Tasks</CardTitle>
        <CardDescription>
          Overview of your recent tasks and their status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <p className="font-medium">{item.task}</p>
                <p className="text-sm text-muted-foreground">{item.project}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={item.status === "Completed" ? "default" : item.status === "In Progress" ? "secondary" : "outline"}>
                  {item.status}
                </Badge>
                <Badge variant={item.priority === "High" ? "destructive" : item.priority === "Medium" ? "secondary" : "outline"}>
                  {item.priority}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
