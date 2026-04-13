import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Bot, Workflow, History, ArrowRight, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  await requireUser();

  const dbUser = user?.email
    ? await prisma.user.findUnique({ where: { email: user.email } })
    : null;

  const [agentCount, workflowCount, runCount] = dbUser
    ? await Promise.all([
        prisma.agent.count({ where: { userId: dbUser.id } }),
        prisma.workflow.count({ where: { userId: dbUser.id } }),
        prisma.workflowRun.count({
          where: { workflow: { userId: dbUser.id } },
        }),
      ])
    : [0, 0, 0];

  const recentAgents = dbUser
    ? await prisma.agent.findMany({
        where: { userId: dbUser.id },
        orderBy: { updatedAt: "desc" },
        take: 3,
      })
    : [];

  const recentWorkflows = dbUser
    ? await prisma.workflow.findMany({
        where: { userId: dbUser.id },
        orderBy: { updatedAt: "desc" },
        take: 3,
      })
    : [];

  const firstName = dbUser?.name?.split(" ")[0] ?? "there";

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-semibold text-white/90 mb-1">
          Hey, {firstName} 👋
        </h1>
        <p className="text-white/40 text-sm">
          Here's what's happening in your workspace
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: "Agents", value: agentCount, icon: Bot, href: "/agents", color: "violet" },
          { label: "Workflows", value: workflowCount, icon: Workflow, href: "/workflows", color: "blue" },
          { label: "Total Runs", value: runCount, icon: History, href: "/runs", color: "emerald" },
        ].map(({ label, value, icon: Icon, href, color }) => (
          <Link key={label} href={href}>
            <div className="glass-card p-6 cursor-pointer group transition-all duration-200 hover:border-white/14">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  color === "violet" ? "bg-violet-500/15 text-violet-400" :
                  color === "blue" ? "bg-blue-500/15 text-blue-400" :
                  "bg-emerald-500/15 text-emerald-400"
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
              </div>
              <div className="text-3xl font-semibold text-white/90 mb-0.5">{value}</div>
              <div className="text-sm text-white/40">{label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent */}
      <div className="grid grid-cols-2 gap-6">
        {/* Recent Agents */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-white/50 uppercase tracking-wider">Recent Agents</h2>
            <Link href="/agents" className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {recentAgents.length === 0 ? (
              <div className="glass-card p-4 text-center text-white/25 text-sm">
                No agents yet
              </div>
            ) : (
              recentAgents.map((agent) => (
                <Link key={agent.id} href={`/agents/${agent.id}`}>
                  <div className="glass-card px-4 py-3 flex items-center gap-3 hover:border-white/14 transition-all cursor-pointer">
                    <span className="text-xl">{agent.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white/80 truncate">{agent.name}</div>
                      <div className="text-xs text-white/30">{agent.model}</div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Workflows */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-white/50 uppercase tracking-wider">Recent Workflows</h2>
            <Link href="/workflows" className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {recentWorkflows.length === 0 ? (
              <div className="glass-card p-4 text-center text-white/25 text-sm">
                No workflows yet
              </div>
            ) : (
              recentWorkflows.map((wf) => (
                <Link key={wf.id} href={`/workflows/${wf.id}`}>
                  <div className="glass-card px-4 py-3 flex items-center gap-3 hover:border-white/14 transition-all cursor-pointer">
                    <span className="text-xl">{wf.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white/80 truncate">{wf.name}</div>
                      <div className="text-xs text-white/30">{wf.description ?? "No description"}</div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
