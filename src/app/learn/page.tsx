"use client";
import { useState, useEffect } from "react";
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
      { title: "How Cabinet Government Works", minutes: 5, slug: "cabinet-government" },
      { title: "What is the Governor General?", minutes: 4, slug: "governor-general" },
      { title: "How Minority Governments Work", minutes: 5, slug: "minority-governments" },
      { title: "What is Prorogation?", minutes: 4, slug: "prorogation" },
      { title: "How Public Services Are Funded", minutes: 5, slug: "public-services-funding" },
      { title: "What is the Ombudsman?", minutes: 4, slug: "ombudsman" },
      { title: "How Auditor Generals Work", minutes: 4, slug: "auditor-general" },
      { title: "What is a Coalition Government?", minutes: 5, slug: "coalition-government" },
      { title: "How Question Period Works", minutes: 4, slug: "question-period" },
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
      { title: "What is Nationalism?", minutes: 5, slug: "what-is-nationalism" },
      { title: "What is Populism?", minutes: 5, slug: "what-is-populism" },
      { title: "What is Feminism?", minutes: 5, slug: "what-is-feminism" },
      { title: "What is Green Politics?", minutes: 4, slug: "what-is-green-politics" },
      { title: "What is Neoliberalism?", minutes: 5, slug: "what-is-neoliberalism" },
      { title: "What is Communism?", minutes: 6, slug: "what-is-communism" },
      { title: "What is Authoritarianism?", minutes: 5, slug: "what-is-authoritarianism" },
      { title: "What is Progressivism?", minutes: 4, slug: "what-is-progressivism" },
      { title: "What is Classical Liberalism?", minutes: 5, slug: "what-is-classical-liberalism" },
      { title: "What is Christian Democracy?", minutes: 4, slug: "what-is-christian-democracy" },
      { title: "What is Technocracy?", minutes: 4, slug: "what-is-technocracy" },
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
      { title: "Mao Zedong and Modern China", minutes: 7, slug: "mao-zedong" },
      { title: "Simone de Beauvoir and Political Feminism", minutes: 5, slug: "simone-de-beauvoir" },
      { title: "Lester B. Pearson and Canadian Peacekeeping", minutes: 5, slug: "lester-pearson" },
      { title: "Rosa Parks and the Civil Rights Movement", minutes: 5, slug: "rosa-parks" },
      { title: "John A. Macdonald: Father and Controversies", minutes: 6, slug: "john-a-macdonald" },
      { title: "Mark Carney and Economic Policy", minutes: 5, slug: "mark-carney" },
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
      { title: "Truth and Reconciliation in Canada", minutes: 7, slug: "truth-and-reconciliation" },
      { title: "What is the World Bank?", minutes: 5, slug: "world-bank" },
      { title: "How the IMF Works", minutes: 5, slug: "imf" },
      { title: "What is CUSMA/NAFTA?", minutes: 5, slug: "cusma-nafta" },
      { title: "Canada's Role in Afghanistan", minutes: 6, slug: "canada-afghanistan" },
      { title: "What is the Paris Agreement?", minutes: 5, slug: "paris-agreement" },
      { title: "India's Political System", minutes: 6, slug: "india-politics" },
      { title: "The European Union Explained", minutes: 6, slug: "european-union" },
      { title: "What is BRICS?", minutes: 5, slug: "what-is-brics" },
      { title: "North Korea: What's Actually Going On?", minutes: 6, slug: "north-korea" },
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
      { title: "Housing Crisis in Ontario", minutes: 6, slug: "housing-crisis-ontario" },
      { title: "Student Debt and Tuition Policy", minutes: 5, slug: "student-debt-tuition" },
      { title: "Trans Rights and Politics", minutes: 6, slug: "trans-rights-politics" },
      { title: "Indigenous Land Rights", minutes: 7, slug: "indigenous-land-rights" },
      { title: "Carbon Tax: For and Against", minutes: 5, slug: "carbon-tax" },
      { title: "Euthanasia and MAID in Canada", minutes: 6, slug: "maid-canada" },
      { title: "Media Bias and How to Spot It", minutes: 5, slug: "media-bias" },
      { title: "Misinformation and Democracy", minutes: 5, slug: "misinformation-democracy" },
      { title: "Online Privacy and Surveillance", minutes: 5, slug: "online-privacy" },
      { title: "AI and Political Power", minutes: 5, slug: "ai-and-politics" },
    ],
  },
  {
    category: "Economy",
    color: "#f472b6",
    icon: "💰",
    modules: [
      { title: "How Inflation Works", minutes: 5, slug: "how-inflation-works" },
      { title: "What is the Bank of Canada?", minutes: 5, slug: "bank-of-canada" },
      { title: "How Interest Rates Affect You", minutes: 5, slug: "interest-rates" },
      { title: "What is a Recession?", minutes: 4, slug: "what-is-recession" },
      { title: "How Trade Deficits Work", minutes: 5, slug: "trade-deficits" },
      { title: "What is GDP?", minutes: 4, slug: "what-is-gdp" },
      { title: "How Government Debt Works", minutes: 5, slug: "government-debt" },
      { title: "What is Austerity?", minutes: 5, slug: "what-is-austerity" },
      { title: "How Taxes Fund Public Services", minutes: 5, slug: "taxes-public-services" },
      { title: "What is Quantitative Easing?", minutes: 5, slug: "quantitative-easing" },
      { title: "Gig Economy and Worker Rights", minutes: 5, slug: "gig-economy" },
      { title: "What is a Living Wage?", minutes: 4, slug: "living-wage" },
      { title: "How Supply Chains Affect Politics", minutes: 5, slug: "supply-chains-politics" },
      { title: "Corporate Tax and Loopholes", minutes: 5, slug: "corporate-tax" },
      { title: "What is Economic Nationalism?", minutes: 5, slug: "economic-nationalism" },
    ],
  },
  {
    category: "History",
    color: "#e879f9",
    icon: "📜",
    modules: [
      { title: "The Cold War Explained", minutes: 7, slug: "cold-war" },
      { title: "How World War II Changed Politics", minutes: 7, slug: "ww2-politics" },
      { title: "The Civil Rights Movement", minutes: 6, slug: "civil-rights-movement" },
      { title: "The Fall of the Soviet Union", minutes: 6, slug: "fall-of-soviet-union" },
      { title: "Canada's Role in World War I", minutes: 5, slug: "canada-ww1" },
      { title: "The October Crisis of 1970", minutes: 5, slug: "october-crisis" },
      { title: "Apartheid in South Africa", minutes: 6, slug: "apartheid" },
      { title: "The French Revolution and Democracy", minutes: 6, slug: "french-revolution" },
      { title: "The Rwandan Genocide", minutes: 6, slug: "rwandan-genocide" },
      { title: "How the Holocaust Shaped Human Rights", minutes: 7, slug: "holocaust-human-rights" },
      { title: "The Arab Spring", minutes: 6, slug: "arab-spring" },
      { title: "Residential Schools in Canada", minutes: 7, slug: "residential-schools" },
      { title: "The Vietnam War and Its Legacy", minutes: 6, slug: "vietnam-war" },
      { title: "The Cuban Missile Crisis", minutes: 5, slug: "cuban-missile-crisis" },
      { title: "How Colonialism Shaped the Modern World", minutes: 7, slug: "colonialism-modern-world" },
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
  Economy: "#f472b6",
  History: "#e879f9",
};

const PAGE_SIZE = 20;

export default function Learn() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/progress")
      .then(r => r.json())
      .then(data => {
        if (data.slugs) setCompleted(new Set(data.slugs));
      })
      .catch(() => {});
  }, []);

  const filters = ["All", "Systems", "Ideologies", "Figures", "Canada & World", "Issues", "Economy", "History"];

  const grouped = activeFilter === "All"
    ? PATHS.map(p => ({ ...p, modules: p.modules.filter(m => m.title.toLowerCase().includes(search.toLowerCase())) })).filter(p => p.modules.length > 0)
    : PATHS.filter(p => p.category === activeFilter).map(p => ({ ...p, modules: p.modules.filter(m => m.title.toLowerCase().includes(search.toLowerCase())) })).filter(p => p.modules.length > 0);

  // flatten all modules for pagination
  const allModules = grouped.flatMap(p => p.modules.map(m => ({ ...m, category: p.category, color: p.color, icon: p.icon })));
  const totalPages = Math.ceil(allModules.length / PAGE_SIZE);
  const paginated = allModules.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // re-group paginated modules by category
  const paginatedGrouped = grouped.map(p => ({
    ...p,
    modules: paginated.filter(m => m.category === p.category),
  })).filter(p => p.modules.length > 0);

  const handleFilterChange = (f: string) => {
    setActiveFilter(f);
    setPage(1);
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  return (
    <AppLayout active="/learn">
      <div style={{ padding: "24px 20px", maxWidth: "820px", width: "100%", margin: "0 auto", fontFamily: "'DM Sans', sans-serif", color: "#fff" }}>

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ marginBottom: "28px" }}>
          <div style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-1px", marginBottom: "4px" }}>Learn</div>
          <div style={{ fontSize: "14px", color: "#666" }}>Flashcard modules on politics, systems, and ideas. · {allModules.length} total</div>
        </motion.div>

        {(() => {
          const allSlugs = PATHS.flatMap(p => p.modules.map(m => ({ ...m, category: p.category, color: p.color })));
          const totalDone = allSlugs.filter(m => completed.has(m.slug)).length;
          const nextUp = allSlugs.find(m => !completed.has(m.slug));
          const totalAll = allSlugs.length;
          const overallPct = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;

          return totalDone > 0 && nextUp ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              style={{ marginBottom: "24px" }}
            >
              <div
                onClick={() => window.location.href = `/learn/${nextUp.slug}`}
                style={{
                  backgroundColor: "rgba(255,255,255,0.02)",
                  border: `1px solid ${nextUp.color}30`,
                  borderRadius: "16px", padding: "18px 20px",
                  cursor: "pointer", transition: "border-color 0.2s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", color: nextUp.color }}>
                    Continue learning
                  </div>
                  <div style={{ fontSize: "12px", color: "#555", fontWeight: "600" }}>
                    {totalDone}/{totalAll} done · {overallPct}%
                  </div>
                </div>
                <div style={{ height: "3px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "100px", overflow: "hidden", marginBottom: "14px" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${overallPct}%` }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    style={{ height: "100%", backgroundColor: nextUp.color, borderRadius: "100px" }}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: "15px", fontWeight: "700", color: "#e8e6e0", marginBottom: "2px" }}>{nextUp.title}</div>
                    <div style={{ fontSize: "12px", color: "#555" }}>{nextUp.category} · {nextUp.minutes} min</div>
                  </div>
                  <div style={{ fontSize: "20px", color: nextUp.color, fontWeight: "700", flexShrink: 0, paddingLeft: "12px" }}>→</div>
                </div>
              </div>
            </motion.div>
          ) : null;
        })()}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <input
            placeholder="Search modules..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            style={{
              width: "100%", padding: "12px 18px",
              backgroundColor: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px", color: "#fff",
              fontSize: "14px", fontFamily: "'DM Sans', sans-serif",
              outline: "none", marginBottom: "16px",
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", gap: "8px", marginBottom: "36px", flexWrap: "wrap" }}>
            {filters.map(f => (
              <motion.button
                key={f}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleFilterChange(f)}
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
          <motion.div key={activeFilter + search + page}>
            {paginatedGrouped.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", padding: "60px 20px", color: "#555", fontSize: "14px" }}>
                No modules found{search ? ` for "${search}"` : ""}.
              </motion.div>
            )}
            {paginatedGrouped.map((path, pi) => (
              <motion.div
                key={path.category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: pi * 0.08, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                style={{ marginBottom: "40px" }}
              >
                {(() => {
                  const totalInCategory = PATHS.find(p => p.category === path.category)?.modules.length ?? path.modules.length;
                  const completedInCategory = PATHS.find(p => p.category === path.category)?.modules.filter(m => completed.has(m.slug)).length ?? 0;
                  const pct = Math.round((completedInCategory / totalInCategory) * 100);
                  const allDone = completedInCategory === totalInCategory;
                  return (
                    <div style={{ marginBottom: "16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        <span style={{ fontSize: "20px" }}>{path.icon}</span>
                        <span style={{ fontSize: "16px", fontWeight: "700", color: path.color }}>{path.category}</span>
                        <span style={{ fontSize: "12px", color: "#555" }}>{totalInCategory} modules</span>
                        {allDone && (
                          <motion.span
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            style={{ fontSize: "11px", fontWeight: "700", color: "#4ade80", backgroundColor: "#4ade8015", border: "1px solid #4ade8030", padding: "2px 8px", borderRadius: "100px" }}
                          >Complete 🎉</motion.span>
                        )}
                        <span style={{ fontSize: "12px", color: allDone ? "#4ade80" : "#444", marginLeft: "auto", fontWeight: "600" }}>
                          {completedInCategory}/{totalInCategory}
                        </span>
                      </div>
                      <div style={{ height: "3px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "100px", overflow: "hidden" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                          style={{ height: "100%", backgroundColor: allDone ? "#4ade80" : path.color, borderRadius: "100px" }}
                        />
                      </div>
                    </div>
                  );
                })()}
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
                        border: completed.has(mod.slug) ? "2px solid #4ade80" : `2px solid ${path.color}30`,
                        backgroundColor: completed.has(mod.slug) ? "#4ade8015" : `${path.color}10`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "13px", color: completed.has(mod.slug) ? "#4ade80" : path.color, fontWeight: "700", flexShrink: 0,
                      }}>{completed.has(mod.slug) ? "✓" : i + 1}</div>
                      <span style={{ fontSize: "14px", fontWeight: "600", color: "#ccc" }}>{mod.title}</span>
                    </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {completed.has(mod.slug) && (
                        <motion.div
                          initial={{ scale: 0 }} animate={{ scale: 1 }}
                          style={{
                            width: "20px", height: "20px", borderRadius: "50%",
                            backgroundColor: "#4ade8020", border: "1px solid #4ade8060",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "11px", flexShrink: 0,
                          }}
                        >✓</motion.div>
                      )}
                      <span style={{ fontSize: "12px", color: "#555", whiteSpace: "nowrap" }}>{mod.minutes} min</span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "40px", paddingBottom: "40px" }}>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: "8px 16px", borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.08)",
                backgroundColor: "transparent", color: page === 1 ? "#555" : "#aaa",
                fontSize: "13px", fontWeight: "600", cursor: page === 1 ? "default" : "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >← Prev</motion.button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <motion.button
                key={p}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setPage(p)}
                style={{
                  width: "36px", height: "36px", borderRadius: "10px",
                  border: page === p ? "1px solid #f5a623" : "1px solid rgba(255,255,255,0.08)",
                  backgroundColor: page === p ? "rgba(245,166,35,0.1)" : "transparent",
                  color: page === p ? "#f5a623" : "#555",
                  fontSize: "13px", fontWeight: "600", cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >{p}</motion.button>
            ))}

            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: "8px 16px", borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.08)",
                backgroundColor: "transparent", color: page === totalPages ? "#555" : "#aaa",
                fontSize: "13px", fontWeight: "600", cursor: page === totalPages ? "default" : "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >Next →</motion.button>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
