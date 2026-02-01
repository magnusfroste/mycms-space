import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAnalyticsSummary } from '@/models/analytics';
import { Eye, Users, FolderOpen, MessageSquare, TrendingUp, BarChart3 } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  description?: string;
}

const StatCard = ({ title, value, icon, description }: StatCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className="text-muted-foreground">{icon}</div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    </CardContent>
  </Card>
);

const StatCardSkeleton = () => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-5 w-5 rounded" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-32 mt-2" />
    </CardContent>
  </Card>
);

export const AnalyticsDashboard = () => {
  const [days, setDays] = useState(30);
  const { data, isLoading, error } = useAnalyticsSummary(days);

  if (error) {
    return (
      <div className="p-6">
        <p className="text-destructive">Could not load analytics: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Overview of visitor statistics and engagement</p>
        </div>
        <Select value={days.toString()} onValueChange={(v) => setDays(parseInt(v))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Total Page Views"
              value={data?.totalPageViews || 0}
              icon={<Eye className="h-5 w-5" />}
              description={`${data?.uniqueVisitors || 0} unique visitors`}
            />
            <StatCard
              title="Unique Visitors"
              value={data?.uniqueVisitors || 0}
              icon={<Users className="h-5 w-5" />}
            />
            <StatCard
              title="Project Views"
              value={data?.totalProjectViews || 0}
              icon={<FolderOpen className="h-5 w-5" />}
            />
            <StatCard
              title="Chat Sessions"
              value={data?.totalChatSessions || 0}
              icon={<MessageSquare className="h-5 w-5" />}
              description={`${data?.totalChatMessages || 0} messages total`}
            />
          </>
        )}
      </div>

      {/* Top Pages & Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              Popular Pages
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            ) : data?.topPages && data.topPages.length > 0 ? (
              <div className="space-y-3">
                {data.topPages.map((page, i) => (
                  <div key={page.page_slug} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-5">
                        {i + 1}.
                      </span>
                      <span className="font-medium">/{page.page_slug}</span>
                    </div>
                    <span className="text-muted-foreground">{page.count} views</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Top Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5" />
              Popular Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            ) : data?.topProjects && data.topProjects.length > 0 ? (
              <div className="space-y-3">
                {data.topProjects.map((project, i) => (
                  <div key={project.project_id} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-5">
                        {i + 1}.
                      </span>
                      <span className="font-medium truncate max-w-[200px]">{project.title}</span>
                    </div>
                    <span className="text-muted-foreground">{project.count} views</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Views over time */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Views Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : data?.viewsByDay && data.viewsByDay.length > 0 ? (
            <div className="h-40 flex items-end gap-1">
              {data.viewsByDay.map((day) => {
                const maxViews = Math.max(...data.viewsByDay.map((d) => d.views));
                const height = maxViews > 0 ? (day.views / maxViews) * 100 : 0;
                return (
                  <div
                    key={day.date}
                    className="flex-1 bg-primary/20 hover:bg-primary/40 transition-colors rounded-t relative group"
                    style={{ height: `${Math.max(height, 4)}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover border px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {day.date}: {day.views} views
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No data yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
