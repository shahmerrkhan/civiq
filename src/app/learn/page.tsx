"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/AppLayout";

const PATHS = [
  {
    category: "Systems",
    color: "#60a5fa",
    icon: "🏛️",
    modules: [
      { title: "How Ontario's Legislature Works", minutes: 5, slug: "how-ontarios-legislature-works" },
      { title: "What Does an MPP Actually Do?", minutes: 4, slug: "what-does-an-mpp-actually-do" },
      { title: "How a Bill Becomes Law", minutes: 5, slug: "how-a-bill-becomes-law" },
      { title: "Provincial vs Federal Power", minutes: 6, slug: "provincial-vs-federal-power" },
      { title: "How Ontario's Budget Works", minutes: 7, slug: "how-ontarios-budget-works" },
      { title: "Ontario's Tax System Explained", minutes: 5, slug: "ontarios-tax-system" },
      { title: "How Municipal Government Works", minutes: 4, slug: "municipal-government" },
      { title: "What is the Charter of Rights?", minutes: 5, slug: "charter-of-rights" },
      { title: "How the Supreme Court Works", minutes: 5, slug: "supreme-court" },
      { title: "What is the Notwithstanding Clause?", minutes: 4, slug: "notwithstanding-clause" },
      { title: "How Ontario's Healthcare System Works", minutes: 6, slug: "ontario-healthcare-system" },
      { title: "What is Lobbying?", minutes: 4, slug: "what-is-lobbying" },
      { title: "How Media Shapes Politics", minutes: 5, slug: "media-and-politics" },
      { title: "What is Gerrymandering?", minutes: 4, slug: "gerrymandering" },
      { title: "How Political Parties Work", minutes: 5, slug: "political-parties" },
      { title: "What is a Referendum?", minutes: 4, slug: "what-is-referendum" },
    ],
  },
  {
    category: "Ideologies",
    color: "#a78bfa",
    icon: "🧠",
    modules: [
      { title: "What is Capitalism?", minutes: 5, slug: "what-is-capitalism" },
      { title: "What is Socialism?", minutes: 5, slug: "what-is-socialism" },
      { title: "What is Liberalism?", minutes: 4, slug: "what-is-liberalism" },
      { title: "What is Conservatism?", minutes: 4, slug: "what-is-conservatism" },
      { title: "What is Marxism?", minutes: 6, slug: "what-is-marxism" },
      { title: "What is Libertarianism?", minutes: 5, slug: "what-is-libertarianism" },
      { title: "What is Anarchism?", minutes: 5, slug: "what-is-anarchism" },
      { title: "What is Fascism?", minutes: 5, slug: "what-is-fascism" },
      { title: "What is Social Democracy?", minutes: 4, slug: "what-is-social-democracy" },
    ],
  },
  {
    category: "Figures",
    color: "#f5a623",
    icon: "👤",
    modules: [
      { title: "Che Guevara: Revolutionary or War Criminal?", minutes: 7, slug: "che-guevara" },
      { title: "Pierre Trudeau and the Charter", minutes: 6, slug: "pierre-trudeau" },
      { title: "Margaret Thatcher and Neoliberalism", minutes: 6, slug: "margaret-thatcher" },
      { title: "Tommy Douglas and Canadian Healthcare", minutes: 5, slug: "tommy-douglas" },
      { title: "Doug Ford: Policies and Controversies", minutes: 6, slug: "doug-ford" },
      { title: "Jagmeet Singh and the NDP", minutes: 5, slug: "jagmeet-singh" },
      { title: "Karl Marx: Ideas and Legacy", minutes: 6, slug: "karl-marx" },
      { title: "Nelson Mandela and Justice", minutes: 6, slug: "nelson-mandela" },
      { title: "Malala Yousafzai and Education Rights", minutes: 5, slug: "malala-yousafzai" },
      { title: "Justin Trudeau: Legacy and Criticism", minutes: 6, slug: "justin-trudeau" },
      { title: "Barack Obama and American Politics", minutes: 6, slug: "barack-obama" },
      { title: "Donald Trump: Rise and Impact", minutes: 7, slug: "donald-trump" },
      { title: "Angela Merkel and European Leadership", minutes: 5, slug: "angela-merkel" },
      { title: "Fidel Castro: Cuba's Controversial Leader", minutes: 6, slug: "fidel-castro" },
      { title: "Gandhi and Non-Violent Resistance", minutes: 6, slug: "mahatma-gandhi" },
      { title: "Martin Luther King Jr. and Civil Rights", minutes: 6, slug: "martin-luther-king" },
      { title: "Alexandria Ocasio-Cortez and Progressive Politics", minutes: 5, slug: "aoc" },
      { title: "Winston Churchill: Hero or Villain?", minutes: 6, slug: "winston-churchill" },
      { title: "Vladimir Putin and Russian Power", minutes: 6, slug: "vladimir-putin" },
    ],
  },
  {
    category: "Canada & World",
    color: "#34d399",
    icon: "🌍",
    modules: [
      { title: "How Canada's Federal Government Works", minutes: 6, slug: "federal-government" },
      { title: "What Does the Prime Minister Actually Do?", minutes: 5, slug: "prime-minister-role" },
      { title: "Canada's Senate: What's the Point?", minutes: 4, slug: "canadas-senate" },
      { title: "First Nations and Canadian Politics", minutes: 7, slug: "first-nations-politics" },
      { title: "Canada's Immigration System", minutes: 6, slug: "canada-immigration" },
      { title: "The UN: What Does It Actually Do?", minutes: 5, slug: "united-nations" },
      { title: "NATO and Why Canada Is In It", minutes: 5, slug: "nato-canada" },
      { title: "How Elections Work in Canada", minutes: 5, slug: "canadian-elections" },
      { title: "What is the Commonwealth?", minutes: 4, slug: "commonwealth" },
      { title: "Canada-US Relations Explained", minutes: 5, slug: "canada-us-relations" },
      { title: "What is Colonialism?", minutes: 6, slug: "what-is-colonialism" },
      { title: "The Israeli-Palestinian Conflict", minutes: 7, slug: "israel-palestine" },
      { title: "Russia-Ukraine War: Background", minutes: 6, slug: "russia-ukraine" },
      { title: "China's Political System", minutes: 6, slug: "china-politics" },
      { title: "What is the G7?", minutes: 4, slug: "what-is-g7" },
    ],
  },
  {
    category: "Issues",
    color: "#fb923c",
    icon: "⚡",
    modules: [
      { title: "Climate Change and Politics", minutes: 6, slug: "climate-change-politics" },
      { title: "What is Universal Basic Income?", minutes: 5, slug: "universal-basic-income" },
      { title: "Drug Policy in Canada", minutes: 5, slug: "drug-policy-canada" },
      { title: "Gun Control: Canada vs US", minutes: 5, slug: "gun-control" },
      { title: "Abortion Rights and Politics", minutes: 6, slug: "abortion-rights" },
      { title: "Police Reform and Defunding Debate", minutes: 6, slug: "police-reform" },
      { title: "Free Speech vs Hate Speech", minutes: 5, slug: "free-speech" },
      { title: "Income Inequality in Ontario", minutes: 5, slug: "income-inequality" },
      { title: "Healthcare Privatization Debate", minutes: 6, slug: "healthcare-privatization" },
      { title: "Social Media and Democracy", minutes: 5, slug: "social-media-democracy" },
      { title: "What is Affirmative Action?", minutes: 5, slug: "affirmative-action" },
      { title: "Prison System and Reform", minutes: 6, slug: "prison-reform" },
      { title: "Rent Control Debate", minutes: 5, slug: "rent-control" },
      { title: "Minimum Wage Economics", minutes: 5, slug: "minimum-wage-economics" },
      { title: "Electoral Reform in Canada", minutes: 5, slug: "electoral-reform" },
    ],
  },
];

const filterColors: Record<string, string> = {
  All: "#f5a623",
  Systems: "#60a5fa",
  Ideologies: "#a78bfa",
  Figures: "#f5a623",
  "Canada & World": "#34d399",
  Issues: "#fb923c",
};

export default function Learn() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filters = ["All", "Systems", "Ideologies", "Figures", "Canada & World", "Issues"];

  const grouped = activeFilter === "All"
    ? PATHS.map(p => ({ ...p, modules: p.modules.filter(m => m.title.toLowerCase().includes(search.toLowerCase())) })).filter(p => p.modules.length > 0)
    : PATHS.filter(p => p.category === activeFilter).map(p => ({ ...p, modules: p.modules.filter(m => m.title.toLowerCase().includes(search.toLowerCase())) })).filter(p => p.modules.length > 0);

  return (
    <AppLayout active="/learn">
      <div style={{ padding: "40px 48px", maxWidth: "820px", width: "100%", margin: "0 auto", fontFamily: "'DM Sans', sans-serif", color: "#fff" }}>

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ marginBottom: "28px" }}>
          <div style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-1px", marginBottom: "4px" }}>Learn</div>
          <div style={{ fontSize: "14px", color: "#444" }}>Flashcard modules on politics, systems, and ideas.</div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <input
            placeholder="Search modules..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "12px 18px",
              backgroundColor: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px", color: "#fff",
              fontSize: "14px", fontFamily: "'DM Sans', sans-serif",
              outline: "none", marginBottom: "16px",
              transition: "border-color 0.2s ease",
            }}
          />
          <div style={{ display: "flex", gap: "8px", marginBottom: "36px", flexWrap: "wrap" }}>
            {filters.map(f => (
              <motion.button
                key={f}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveFilter(f)}
                style={{
                  padding: "7px 18px", borderRadius: "100px",
                  fontSize: "13px", fontWeight: "600",
                  border: activeFilter === f ? `1px solid ${filterColors[f]}` : "1px solid rgba(255,255,255,0.08)",
                  backgroundColor: activeFilter === f ? `${filterColors[f]}15` : "transparent",
                  color: activeFilter === f ? filterColors[f] : "#555",
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.2s ease",
                }}
              >{f}</motion.button>
            ))}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div key={activeFilter + search}>
            {grouped.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", padding: "60px 20px", color: "#333", fontSize: "14px" }}>
                No modules found for "{search}"
              </motion.div>
            )}
            {grouped.map((path, pi) => (
              <motion.div
                key={path.category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: pi * 0.08, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                style={{ marginBottom: "40px" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                  <span style={{ fontSize: "20px" }}>{path.icon}</span>
                  <span style={{ fontSize: "16px", fontWeight: "700", color: path.color }}>{path.category}</span>
                  <span style={{ fontSize: "12px", color: "#333" }}>{path.modules.length} modules</span>
                </div>
                {path.modules.map((mod, i) => (
                  <motion.div
                    key={mod.slug}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: pi * 0.05 + i * 0.03, duration: 0.3 }}
                    whileHover={{ x: 4, backgroundColor: "rgba(255,255,255,0.04)", transition: { duration: 0.15 } }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => window.location.href = `/learn/${mod.slug}`}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "14px 18px",
                      backgroundColor: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      borderRadius: "12px", marginBottom: "8px",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <div style={{
                        width: "30px", height: "30px", borderRadius: "50%",
                        border: `2px solid ${path.color}30`,
                        backgroundColor: `${path.color}10`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "13px", color: path.color, fontWeight: "700", flexShrink: 0,
                      }}>{i + 1}</div>
                      <span style={{ fontSize: "14px", fontWeight: "600", color: "#ccc" }}>{mod.title}</span>
                    </div>
                    <span style={{ fontSize: "12px", color: "#333", whiteSpace: "nowrap" }}>{mod.minutes} min</span>
                  </motion.div>
                ))}
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}