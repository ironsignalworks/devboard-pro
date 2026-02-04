import { Code2, FileText, FolderKanban, Plus, TrendingDown, TrendingUp, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "../context/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { listSnippets } from "../api/snippets";
import { listProjects } from "../api/projects";
import { listNotes } from "../api/notes";
import { listTags } from "../api/tags";
import { listActivity } from "../api/activity";
import { getProductivity } from "../api/analytics";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { tagBadgeStyle } from "@/lib/tagColors";
import ListSkeleton from "@/components/ListSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

const DAY_MS = 24 * 60 * 60 * 1000;

const buildDateKey = (value: Date) =>
  `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;

const lastNDays = (days: number) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today.getTime() - (days - 1 - index) * DAY_MS);
    return {
      date,
      key: buildDateKey(date),
      label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    };
  });
};

export default function Dashboard() {
  const { user } = useAuth();
  const [recentSnippets, setRecentSnippets] = useState<any[]>([]);
  const [snippetsTotal, setSnippetsTotal] = useState(0);
  const [snippetPage] = useState(1);
  const [snippetLimit] = useState(6);

  const [projects, setProjects] = useState<any[]>([]);
  const [projectsTotal, setProjectsTotal] = useState(0);
  const [projectPage] = useState(1);
  const [projectLimit] = useState(6);

  const [notesTotal, setNotesTotal] = useState(0);
  const [snippetItems, setSnippetItems] = useState<any[]>([]);
  const [projectItems, setProjectItems] = useState<any[]>([]);
  const [noteItems, setNoteItems] = useState<any[]>([]);
  const [tagColorMap, setTagColorMap] = useState<Record<string, string>>({});
  const [activityItems, setActivityItems] = useState<any[]>([]);
  const [analyticsSeries, setAnalyticsSeries] = useState<any[] | null>(null);

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const [snipsRes, projsRes, notesRes, tagsRes, activityRes, analyticsRes] = await Promise.all([
          listSnippets({ page: snippetPage, limit: 100 }),
          listProjects({ page: projectPage, limit: 100 }),
          listNotes({ page: 1, limit: 100 }),
          listTags(),
          listActivity(12),
          getProductivity(7),
        ]);

        if (cancelled) return;

        if (snipsRes && Array.isArray(snipsRes.items)) {
          setRecentSnippets(snipsRes.items.slice(0, snippetLimit));
          setSnippetsTotal(snipsRes.total || 0);
          setSnippetItems(snipsRes.items);
        } else {
          setRecentSnippets([]);
          setSnippetsTotal(0);
          setSnippetItems([]);
        }

        if (projsRes && Array.isArray(projsRes.items)) {
          setProjects(projsRes.items.slice(0, projectLimit));
          setProjectsTotal(projsRes.total || 0);
          setProjectItems(projsRes.items);
        } else {
          setProjects([]);
          setProjectsTotal(0);
          setProjectItems([]);
        }

        if (notesRes && Array.isArray(notesRes.items)) {
          setNotesTotal(notesRes.total || 0);
          setNoteItems(notesRes.items);
        } else {
          setNotesTotal(0);
          setNoteItems([]);
        }

        const tagItems = Array.isArray(tagsRes?.items) ? tagsRes.items : [];
        const nextMap: Record<string, string> = {};
        for (const tag of tagItems) {
          if (tag?.name && tag?.color) nextMap[tag.name] = tag.color;
        }
        setTagColorMap(nextMap);

        setActivityItems(Array.isArray(activityRes?.items) ? activityRes.items : []);
        setAnalyticsSeries(Array.isArray(analyticsRes?.series) ? analyticsRes.series : null);
      } catch (err) {
        console.error("Dashboard load error", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const productivityData = useMemo(() => {
    if (analyticsSeries) return analyticsSeries;
    const days = lastNDays(7);
    const counts: Record<string, { snippets: number; notes: number; projects: number }> = {};

    days.forEach(({ key }) => {
      counts[key] = { snippets: 0, notes: 0, projects: 0 };
    });

    const inc = (items: any[], field: "snippets" | "notes" | "projects") => {
      items.forEach((item) => {
        const raw = item?.createdAt || item?.updatedAt;
        if (!raw) return;
        const date = new Date(raw);
        if (Number.isNaN(date.getTime())) return;
        const key = buildDateKey(date);
        if (!counts[key]) return;
        counts[key][field] += 1;
      });
    };

    inc(snippetItems, "snippets");
    inc(noteItems, "notes");
    inc(projectItems, "projects");

    return days.map(({ key, label }) => ({
      date: label,
      snippets: counts[key]?.snippets || 0,
      notes: counts[key]?.notes || 0,
      projects: counts[key]?.projects || 0,
    }));
  }, [snippetItems, noteItems, projectItems, analyticsSeries]);

  const recentNotes = useMemo(() => noteItems.slice(0, 6), [noteItems]);
  const stripHtml = (value: string) =>
    value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const totalTagCount = useMemo(() => {
    const counts = new Map();
    const add = (items) => {
      (items || []).forEach((item) => {
        const tags = Array.isArray(item?.tags) ? item.tags : [];
        tags.forEach((tag) => {
          if (!tag) return;
          counts.set(tag, (counts.get(tag) || 0) + 1);
        });
      });
    };
    add(snippetItems);
    add(noteItems);
    return counts.size;
  }, [snippetItems, noteItems]);
  const recentTags = useMemo(() => {
    const counts = new Map();
    const add = (items) => {
      (items || []).forEach((item) => {
        const tags = Array.isArray(item?.tags) ? item.tags : [];
        tags.forEach((tag) => {
          if (!tag) return;
          counts.set(tag, (counts.get(tag) || 0) + 1);
        });
      });
    };
    add(snippetItems);
    add(noteItems);
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 6);
  }, [snippetItems, noteItems]);

  const stats = [
    { title: "Total Snippets", value: String(snippetsTotal), icon: Code2, path: "/snippets" },
    { title: "Total Projects", value: String(projectsTotal), icon: FolderKanban, path: "/projects" },
    { title: "Total Notes", value: String(notesTotal), icon: FileText, path: "/notes" },
    { title: "Total Tags", value: String(totalTagCount), icon: Tag, path: "/tags" },
  ];

  const productivitySummary = useMemo(() => {
    const now = new Date();
    const startCurrent = new Date(now.getTime() - 7 * DAY_MS);
    const startPrev = new Date(now.getTime() - 14 * DAY_MS);

    const countInRange = (items: any[], start: Date, end: Date) =>
      items.reduce((acc, item) => {
        const raw = item?.createdAt || item?.updatedAt;
        if (!raw) return acc;
        const date = new Date(raw);
        if (Number.isNaN(date.getTime())) return acc;
        return date >= start && date < end ? acc + 1 : acc;
      }, 0);

    const current =
      countInRange(snippetItems, startCurrent, now) +
      countInRange(noteItems, startCurrent, now) +
      countInRange(projectItems, startCurrent, now);
    const previous =
      countInRange(snippetItems, startPrev, startCurrent) +
      countInRange(noteItems, startPrev, startCurrent) +
      countInRange(projectItems, startPrev, startCurrent);

    const change = previous === 0 ? 0 : ((current - previous) / previous) * 100;
    return { current, previous, change };
  }, [snippetItems, noteItems, projectItems]);

  const trendUp = productivitySummary.change >= 0;
  const trendValue = Math.abs(productivitySummary.change).toFixed(0);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
          Welcome{user?.name ? `, ${user.name}` : ""}
        </h1>
        <p className="text-muted-foreground">Here's an overview of your development workspace.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button className="w-full sm:w-auto" onClick={() => navigate("/snippets?create=1")}>
          <Plus className="mr-2 h-4 w-4" />
          New Snippet
        </Button>
        <Button className="w-full sm:w-auto" variant="secondary" onClick={() => navigate("/notes?create=1")}>
          <Plus className="mr-2 h-4 w-4" />
          New Note
        </Button>
        <Button className="w-full sm:w-auto" variant="secondary" onClick={() => navigate("/projects?create=1")}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="cursor-pointer transition-all hover:shadow-md hover:border-primary/20"
            onClick={() => navigate(stat.path)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Productivity</CardTitle>
              {trendUp ? (
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {trendValue}% {trendUp ? "up" : "down"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {productivitySummary.current} items in the last 7 days
              </p>
              <p className="text-xs text-muted-foreground">Tap to view details</p>
            </CardContent>
          </Card>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Productivity</DialogTitle>
            <DialogDescription>Activity over the last 7 days.</DialogDescription>
          </DialogHeader>
          <div className="h-[240px] sm:h-[320px]">
            <ChartContainer
              config={{
                snippets: { label: "Snippets", color: "hsl(var(--primary))" },
                notes: { label: "Notes", color: "hsl(var(--success))" },
                projects: { label: "Projects", color: "hsl(var(--warning))" },
              }}
              className="h-full w-full"
            >
              <AreaChart data={productivityData} margin={{ left: 12, right: 12, top: 12, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="snippets" stroke="var(--color-snippets)" fill="var(--color-snippets)" fillOpacity={0.15} />
                <Area type="monotone" dataKey="notes" stroke="var(--color-notes)" fill="var(--color-notes)" fillOpacity={0.15} />
                <Area type="monotone" dataKey="projects" stroke="var(--color-projects)" fill="var(--color-projects)" fillOpacity={0.15} />
              </AreaChart>
            </ChartContainer>
          </div>
          {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold">Recent Activity</h2>
            <button onClick={() => navigate('/snippets')} className="text-sm text-primary hover:underline">
              View all
            </button>
          </div>
          <Card>
            <CardContent className="p-4 space-y-3 max-h-[320px] overflow-auto">
              {loading ? (
                <ListSkeleton rows={3} />
              ) : activityItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                activityItems.map((item) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    type="button"
                    onClick={() => {
                      if (item.type === "snippet") navigate(`/snippets/${item.id}`);
                      if (item.type === "note") navigate(`/notes/${item.id}`);
                      if (item.type === "project") navigate(`/projects/${item.id}`);
                    }}
                    className="w-full text-left rounded border border-border/60 px-3 py-2 hover:bg-muted/40"
                  >
                    <div className="text-sm font-medium">{item.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {stripHtml(item.description || "")}
                    </div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">
                      {item.type} {item.action ? `· ${item.action}` : ""}
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold">Notifications</h2>
            <button onClick={() => navigate('/snippets')} className="text-sm text-primary hover:underline">
              View all
            </button>
          </div>
          <Card>
            <CardContent className="p-4 space-y-3 max-h-[320px] overflow-auto">
              {loading ? (
                <ListSkeleton rows={3} />
              ) : activityItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notifications yet.</p>
              ) : (
                activityItems.slice(0, 6).map((item) => (
                  <div
                    key={`${item.type}-note-${item.id}`}
                    className="rounded border border-border/60 px-3 py-2"
                  >
                    <div className="text-sm font-medium">
                      {item.action === "created" ? "New" : "Updated"} {item.type}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {item.title}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold">Recent Snippets</h2>
          <button onClick={() => navigate('/snippets')} className="text-sm text-primary hover:underline">
            View all
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <ListSkeleton rows={3} />
          ) : (
            recentSnippets.map((snippet, index) => (
              <Card
                key={snippet._id || index}
                className="cursor-pointer transition-all hover:shadow-md hover:border-primary/20"
                onClick={() => navigate(`/snippets/${snippet._id}`)}
              >
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">{snippet.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs sm:text-sm text-muted-foreground">{snippet.description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    {snippet.language && (
                      <span className="text-[10px] sm:text-xs rounded border border-border px-1.5 py-0.5 text-muted-foreground">
                        {snippet.language}
                      </span>
                    )}
                    {(snippet.tags || []).map((tag: string) => {
                      const { className, style } = tagBadgeStyle(tag, tagColorMap[tag]);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/snippets?tag=${encodeURIComponent(tag)}`);
                          }}
                        >
                          <span className={`text-[10px] sm:text-xs rounded border px-1.5 py-0.5 ${className}`} style={style}>
                            {tag}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <div>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold">Recent Notes</h2>
          <button onClick={() => navigate('/notes')} className="text-sm text-primary hover:underline">
            View all
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <ListSkeleton rows={3} />
          ) : (
            recentNotes.map((note, index) => (
              <Card
                key={note._id || index}
                className="cursor-pointer transition-all hover:shadow-md hover:border-primary/20"
                onClick={() => navigate(`/notes/${note._id}`)}
              >
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">{note.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{stripHtml(note.content || "")}</p>
                  {Array.isArray(note.tags) && note.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {note.tags.map((tag: string) => {
                        const { className, style } = tagBadgeStyle(tag, tagColorMap[tag]);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(`/notes?tag=${encodeURIComponent(tag)}`);
                            }}
                          >
                            <span className={`text-[10px] rounded border px-1.5 py-0.5 ${className}`} style={style}>
                              {tag}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <div>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold">Recent Tags</h2>
          <button onClick={() => navigate('/tags')} className="text-sm text-primary hover:underline">
            View all
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {loading ? (
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ) : (
            recentTags.map((tag) => (
              <div
                key={tag.name}
                className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary"
              >
                <span className="font-medium">{tag.name}</span>
                <span className="text-[10px] text-primary/80">{tag.count}</span>
              </div>
            ))
          )}
          {!loading && recentTags.length === 0 && (
            <p className="text-sm text-muted-foreground">No tags yet</p>
          )}
        </div>
      </div>

      <div>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold">Active Projects</h2>
          <button onClick={() => navigate('/projects')} className="text-sm text-primary hover:underline">
            View all
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {loading ? (
            <ListSkeleton rows={2} />
          ) : (
            projects.map((project, index) => (
              <Card
                key={project._id || index}
                className="cursor-pointer transition-all hover:shadow-md hover:border-primary/20"
                onClick={() => navigate(`/projects/${project._id}`)}
              >
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">{project.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs sm:text-sm text-muted-foreground">{project.description}</p>
                  <p className="text-[10px] sm:text-xs mt-2 text-muted-foreground">
                    {project.snippetsCount} snippets - {project.notesCount} notes
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
