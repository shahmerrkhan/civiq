import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { sql } from "@/db";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

const MODULE_PROMPTS: Record<string, string> = {
  "how-ontarios-legislature-works": "Explain how Ontario's provincial legislature works to a 16-year-old Canadian student. Cover: what the Legislative Assembly is, how MPPs are elected, how laws get passed, and why it matters to everyday life. Be specific to Ontario. Use ## for section headers.",
  "what-does-an-mpp-actually-do": "Explain what a Member of Provincial Parliament (MPP) does in Ontario to a 16-year-old. Cover their daily responsibilities, how they represent constituents, how they vote on bills, and how to contact yours. Use ## for section headers.",
  "how-a-bill-becomes-law": "Explain step by step how a bill becomes a law in Ontario's provincial legislature. Use a real recent Ontario bill as an example. Write for a 16-year-old. Use ## for section headers.",
  "what-is-capitalism": "Explain capitalism to a 16-year-old Canadian student. Cover core principles, how it works in practice, strengths and criticisms, and how it shapes Ontario's economy. Present both supporter and critic views fairly. Use ## for section headers.",
  "what-is-socialism": "Explain socialism to a 16-year-old Canadian student. Cover core principles, different forms, real world examples, strengths and criticisms. Include Canadian context. Present both supporter and critic views fairly. Use ## for section headers.",
  "che-guevara": "Write a balanced profile of Che Guevara for a 16-year-old. Cover his early life, role in the Cuban Revolution, his ideology, the executions he ordered, his legacy, and why people still debate him. Do not glorify or condemn. Use ## for section headers.",
  "tommy-douglas": "Write a profile of Tommy Douglas for a 16-year-old Canadian student. Cover his background, how he brought public healthcare to Saskatchewan, his role in creating Medicare, and his lasting impact. Include opposition he faced and why he's still relevant. Use ## for section headers.",
  "provincial-vs-federal-power": "Explain the difference between provincial and federal government powers in Canada to a 16-year-old. Use Ontario as the example. Cover what each level controls, why it matters, and real examples of conflicts between them. Use ## for section headers.",
  "how-ontarios-budget-works": "Explain how Ontario's provincial budget works to a 16-year-old. Cover how it's made, what it funds, how to read it, and why it affects everyday life. Use ## for section headers.",
  "what-is-liberalism": "Explain liberalism to a 16-year-old Canadian student. Cover core principles, classical vs modern liberalism, Canadian examples, strengths and criticisms. Present both supporter and critic views fairly. Use ## for section headers.",
  "what-is-conservatism": "Explain conservatism to a 16-year-old Canadian student. Cover core principles, different types, Canadian examples, strengths and criticisms. Present both supporter and critic views fairly. Use ## for section headers.",
  "what-is-marxism": "Explain Marxism to a 16-year-old Canadian student. Cover Marx's core ideas, historical applications, why it attracts supporters, and its criticisms. Present it fairly without glorifying or dismissing. Use ## for section headers.",
  "what-is-libertarianism": "Explain libertarianism to a 16-year-old Canadian student. Cover core principles, economic and social libertarianism, Canadian context, strengths and criticisms. Present both supporter and critic views fairly. Use ## for section headers.",
  "pierre-trudeau": "Write a profile of Pierre Trudeau for a 16-year-old Canadian student. Cover his background, major policies, the Charter of Rights and Freedoms, controversies like the War Measures Act, and his lasting impact on Canada. Use ## for section headers.",
  "margaret-thatcher": "Write a balanced profile of Margaret Thatcher for a 16-year-old. Cover her background, economic policies, privatization, the Falklands War, her legacy, and why she's still debated today. Present both supporter and critic views. Use ## for section headers.",
  "doug-ford": "Write a balanced profile of Doug Ford as Ontario Premier for a 16-year-old. Cover his background, major policies, controversies like Greenbelt, education cuts, healthcare changes, and how different Ontarians view him. Present both supporter and critic views fairly. Use ## for section headers.",
  "ontarios-tax-system": "Explain Ontario's tax system to a 16-year-old Canadian. Cover income tax, HST, property tax, what taxes fund, and why people debate tax levels. Include specific Ontario rates and examples. Use ## for section headers.",
  "municipal-government": "Explain how municipal government works in Ontario to a 16-year-old. Cover mayors, city councils, what they control vs the province, how elections work, and why local politics affects daily life. Use Cambridge or Toronto as examples. Use ## for section headers.",
  "charter-of-rights": "Explain Canada's Charter of Rights and Freedoms to a 16-year-old. Cover what rights it protects, real cases where it mattered, its limits, and why it's controversial sometimes. Be specific with Canadian examples. Use ## for section headers.",
  "what-is-anarchism": "Explain anarchism to a 16-year-old Canadian student. Cover core principles, different types, real historical examples, what anarchists actually want, and criticisms. Present it fairly without dismissing or glorifying. Use ## for section headers.",
  "what-is-fascism": "Explain fascism to a 16-year-old Canadian student. Cover core principles, historical examples like Mussolini and Hitler, what made it appealing to people at the time, how it ended, and warning signs today. Be factual and educational. Use ## for section headers.",
  "what-is-social-democracy": "Explain social democracy to a 16-year-old Canadian student. Cover core principles, how it differs from socialism, real examples like Nordic countries and Canada's NDP, strengths and criticisms. Use ## for section headers.",
  "jagmeet-singh": "Write a profile of Jagmeet Singh for a 16-year-old Canadian. Cover his background, rise in the NDP, key policies, his cultural significance as the first racialized major party leader, and how people view him across the political spectrum. Use ## for section headers.",
  "karl-marx": "Write a balanced profile of Karl Marx for a 16-year-old. Cover his life, core ideas in The Communist Manifesto and Das Kapital, how his ideas influenced history, where they succeeded and failed, and why he's still debated today. Use ## for section headers.",
  "nelson-mandela": "Write a profile of Nelson Mandela for a 16-year-old. Cover apartheid in South Africa, his imprisonment, how he led peaceful transition to democracy, his presidency, and his global legacy. Include complexity — he wasn't without controversy. Use ## for section headers.",
  "malala-yousafzai": "Write a profile of Malala Yousafzai for a 16-year-old. Cover her early life under Taliban rule, the shooting, her recovery and activism, the Malala Fund, and the global debate around education rights. Use ## for section headers.",
"federal-government": "Explain how Canada's federal government works to a 16-year-old. Cover the House of Commons, Senate, Governor General, how bills pass federally, and how it differs from provincial government. Use ## for section headers.",
  "prime-minister-role": "Explain what Canada's Prime Minister actually does to a 16-year-old. Cover their powers, limits, cabinet, relationship with Parliament, and real examples. Use ## for section headers.",
  "canadas-senate": "Explain Canada's Senate to a 16-year-old. Cover what it does, how senators are appointed, why it's controversial, and arguments for reforming or abolishing it. Use ## for section headers.",
  "first-nations-politics": "Explain the relationship between First Nations and Canadian politics to a 16-year-old. Cover treaties, residential schools legacy, land rights, UNDRIP, and current political issues. Be honest about Canada's history. Use ## for section headers.",
  "canada-immigration": "Explain Canada's immigration system to a 16-year-old. Cover how it works, points-based system, refugee process, and the political debate around immigration levels. Use ## for section headers.",
  "united-nations": "Explain what the United Nations actually does to a 16-year-old. Cover its structure, powers, limitations, real examples of successes and failures, and Canada's role. Use ## for section headers.",
  "nato-canada": "Explain NATO and why Canada is a member to a 16-year-old. Cover what NATO does, Article 5, Canada's military contributions, and the debate about Canada's defence spending. Use ## for section headers.",
  "canadian-elections": "Explain how Canadian federal and provincial elections work to a 16-year-old. Cover first-past-the-post, ridings, party leaders, campaign process, and why your vote matters. Use ## for section headers.",
  "commonwealth": "Explain what the Commonwealth is to a 16-year-old Canadian. Cover its history, what it does today, Canada's role, and the debate about its colonial origins. Use ## for section headers.",
  "canada-us-relations": "Explain Canada-US relations to a 16-year-old. Cover trade, CUSMA, border issues, military cooperation, cultural influence, and current tensions. Use ## for section headers.",
  "what-is-colonialism": "Explain colonialism to a 16-year-old Canadian student. Cover what it is, how it shaped Canada, its ongoing impacts on Indigenous peoples, and why it's still relevant today. Use ## for section headers.",
  "israel-palestine": "Explain the Israeli-Palestinian conflict to a 16-year-old in a balanced way. Cover the history, key events, what each side wants, why it's so difficult to resolve, and Canada's position. Present multiple perspectives fairly. Use ## for section headers.",
  "russia-ukraine": "Explain the Russia-Ukraine war to a 16-year-old Canadian. Cover the background, why Russia invaded, what Ukraine is fighting for, Canada's involvement, and what's at stake globally. Use ## for section headers.",
  "china-politics": "Explain China's political system to a 16-year-old. Cover the Communist Party, how it governs, human rights concerns, its relationship with Canada, and why it matters globally. Use ## for section headers.",
  "what-is-g7": "Explain what the G7 is to a 16-year-old. Cover which countries are in it, what they discuss, how decisions are made, and why some people criticize it. Use ## for section headers.",
  "climate-change-politics": "Explain the politics of climate change to a 16-year-old Canadian. Cover the science consensus, carbon tax debate, Ontario's approach, international agreements, and why it's politically divisive. Use ## for section headers.",
  "universal-basic-income": "Explain Universal Basic Income to a 16-year-old Canadian. Cover what it is, pilot programs including Ontario's cancelled one, arguments for and against, and which political parties support it. Use ## for section headers.",
  "drug-policy-canada": "Explain drug policy in Canada to a 16-year-old. Cover cannabis legalization, decriminalization debates, the opioid crisis, harm reduction, and how different provinces approach it. Use ## for section headers.",
  "gun-control": "Explain gun control policy to a 16-year-old, comparing Canada and the US. Cover Canada's laws, the handgun freeze, why Canada and the US differ so much, and the political debate. Use ## for section headers.",
  "abortion-rights": "Explain abortion rights and politics to a 16-year-old Canadian. Cover Canada's legal framework, how it differs from the US, the political debate, and different perspectives including religious and feminist views. Present fairly. Use ## for section headers.",
  "police-reform": "Explain the police reform and defunding debate to a 16-year-old Canadian. Cover what defunding actually means, arguments for reform, arguments against, and what Ontario cities have done. Use ## for section headers.",
  "free-speech": "Explain the free speech vs hate speech debate to a 16-year-old Canadian. Cover what the Charter protects, what hate speech laws exist, real Canadian cases, and different political perspectives. Use ## for section headers.",
  "income-inequality": "Explain income inequality in Ontario to a 16-year-old. Cover the data, causes, effects on daily life, and what different political perspectives say should be done about it. Use ## for section headers.",
  "healthcare-privatization": "Explain the healthcare privatization debate in Ontario to a 16-year-old. Cover what public healthcare currently provides, what privatization would mean, Doug Ford's changes, and arguments on both sides. Use ## for section headers.",
  "social-media-democracy": "Explain how social media affects democracy to a 16-year-old. Cover misinformation, echo chambers, political advertising, platform regulation debates, and what it means for Gen Z specifically. Use ## for section headers.",
  "affirmative-action": "Explain affirmative action to a 16-year-old Canadian. Cover what it is, how it works in Canada vs the US, arguments for and against, and real examples. Present multiple perspectives fairly. Use ## for section headers.",
  "prison-reform": "Explain the prison system and reform debate to a 16-year-old Canadian. Cover how the system works, incarceration rates, Indigenous overrepresentation, rehabilitation vs punishment debate, and reform proposals. Use ## for section headers.",
  "rent-control": "Explain the rent control debate to a 16-year-old Ontario resident. Cover what rent control is, Ontario's current rules, arguments for and against, and how it affects the housing crisis. Use ## for section headers.",
  "minimum-wage-economics": "Explain the economics of minimum wage to a 16-year-old Ontario student. Cover how minimum wage works, what economists say about its effects, Ontario's history with it, and the living wage debate. Use ## for section headers.",
  "electoral-reform": "Explain electoral reform in Canada to a 16-year-old. Cover first-past-the-post problems, proportional representation, ranked ballots, Trudeau's broken promise, and what different parties want. Use ## for section headers.",
  "supreme-court": "Explain how Canada's Supreme Court works to a 16-year-old. Cover how judges are appointed, what cases it hears, landmark Canadian decisions, and why it's politically important. Use ## for section headers.",
  "notwithstanding-clause": "Explain Canada's Notwithstanding Clause to a 16-year-old. Cover what it is, when it's been used including Ontario's use, the controversy around it, and the debate about whether it should exist. Use ## for section headers.",
  "ontario-healthcare-system": "Explain how Ontario's healthcare system works to a 16-year-old. Cover OHIP, what's covered and what isn't, hospital funding, wait times crisis, and current debates about reform. Use ## for section headers.",
  "what-is-lobbying": "Explain lobbying to a 16-year-old Canadian. Cover what lobbyists do, who hires them, how they influence government, Canadian lobbying laws, and why people debate whether it's democratic. Use ## for section headers.",
  "media-and-politics": "Explain how media shapes politics to a 16-year-old. Cover traditional vs social media, media ownership in Canada, bias, misinformation, and how to be a critical news consumer. Use ## for section headers.",
  "gerrymandering": "Explain gerrymandering to a 16-year-old. Cover what it is, how it works, why Canada's system is different from the US, and whether it can happen here. Use ## for section headers.",
  "political-parties": "Explain how political parties work in Canada to a 16-year-old. Cover federal and Ontario parties, how they're funded, party discipline, leadership races, and how to get involved. Use ## for section headers.",
  "what-is-referendum": "Explain what a referendum is to a 16-year-old Canadian. Cover how they work, Canadian examples like Quebec referendums, when governments use them, and the debate about direct democracy. Use ## for section headers.",
  "justin-trudeau": "Write a balanced profile of Justin Trudeau for a 16-year-old Canadian. Cover his rise, major policies, blackface scandal, SNC-Lavalin, COVID response, and why Canadians are divided on his legacy. Use ## for section headers.",
  "barack-obama": "Write a balanced profile of Barack Obama for a 16-year-old. Cover his historic election, major policies, drone warfare, healthcare reform, and his legacy on American and global politics. Use ## for section headers.",
  "donald-trump": "Write a balanced profile of Donald Trump for a 16-year-old. Cover his business background, 2016 election, major policies, impeachments, January 6th, and his impact on politics. Present facts not opinion. Use ## for section headers.",
  "angela-merkel": "Write a profile of Angela Merkel for a 16-year-old. Cover her background, 16 years as German Chancellor, refugee crisis decisions, European leadership, and her legacy. Use ## for section headers.",
  "fidel-castro": "Write a balanced profile of Fidel Castro for a 16-year-old. Cover the Cuban Revolution, his governance, achievements in healthcare and education, human rights abuses, and his contested legacy. Use ## for section headers.",
  "mahatma-gandhi": "Write a profile of Mahatma Gandhi for a 16-year-old. Cover his philosophy of non-violent resistance, role in Indian independence, his complicated views on race and caste, and his global legacy. Use ## for section headers.",
  "martin-luther-king": "Write a profile of Martin Luther King Jr. for a 16-year-old. Cover the Civil Rights Movement, his philosophy, key campaigns, FBI surveillance, his assassination, and his legacy today. Use ## for section headers.",
  "aoc": "Write a profile of Alexandria Ocasio-Cortez for a 16-year-old. Cover her background, how she won her seat, her policies like the Green New Deal, her role in progressive politics, and criticism she faces. Use ## for section headers.",
  "winston-churchill": "Write a balanced profile of Winston Churchill for a 16-year-old. Cover his WWII leadership, his role in the Bengal famine, his views on empire, and why historians debate his legacy so strongly. Use ## for section headers.",
  "vladimir-putin": "Write a balanced profile of Vladimir Putin for a 16-year-old. Cover his rise to power, how Russia changed under him, the Ukraine invasion, human rights record, and why he still has support inside Russia. Use ## for section headers.",
  // Systems
  "what-is-by-election": "Explain what a by-election is to a 16-year-old Canadian. Cover when they happen, how they work, why they matter, and notable Canadian examples. Use ## for section headers.",
  "recalls-and-petitions": "Explain how recalls and petitions work in Canadian democracy to a 16-year-old. Cover what they are, when Canadians can use them, provincial differences, and whether they actually change anything. Use ## for section headers.",
  "parliamentary-privilege": "Explain parliamentary privilege to a 16-year-old Canadian. Cover what it is, why it exists, how it protects MPPs and MPs, and examples of when it's been controversial. Use ## for section headers.",
  "police-services-boards": "Explain how police services boards work in Ontario to a 16-year-old. Cover their role in civilian oversight, how members are appointed, limitations, and why oversight matters. Use ## for section headers.",
  "access-to-information": "Explain Access to Information laws in Canada to a 16-year-old. Cover what the law does, how to file a request, what's exempt, and real examples of what journalists have uncovered. Use ## for section headers.",
  // Ideologies
  "what-is-eco-socialism": "Explain eco-socialism to a 16-year-old. Cover how it combines socialist economics with environmental politics, key thinkers, real-world examples, and criticisms. Use ## for section headers.",
  "what-is-democratic-socialism": "Explain democratic socialism to a 16-year-old Canadian. Cover how it differs from both socialism and social democracy, Canadian examples, Bernie Sanders as a reference, and criticisms. Use ## for section headers.",
  "what-is-paleoconservatism": "Explain paleoconservatism to a 16-year-old. Cover its core ideas, how it differs from mainstream conservatism, US examples, and whether it has any presence in Canada. Use ## for section headers.",
  "what-is-third-way": "Explain Third-Way politics to a 16-year-old. Cover what it is, how Blair and Clinton embodied it, how it tried to blend left and right economics, and criticisms from both sides. Use ## for section headers.",
  "what-is-civic-nationalism": "Explain civic nationalism to a 16-year-old. Cover how it differs from ethnic nationalism, Canadian examples, Quebec as a case study, and why the distinction matters. Use ## for section headers.",
  "what-is-intersectionality": "Explain intersectionality to a 16-year-old Canadian. Cover what the term means, its origins with Kimberlé Crenshaw, how it's used in policy debates, and common criticisms and defences. Present fairly. Use ## for section headers.",
  // Figures
  "zelensky": "Write a profile of Volodymyr Zelensky for a 16-year-old. Cover his background as a comedian, his election, Russia's invasion, his wartime leadership style, and how the world views him. Use ## for section headers.",
  "xi-jinping": "Write a balanced profile of Xi Jinping for a 16-year-old. Cover his rise in the Communist Party, consolidation of power, Belt and Road Initiative, Hong Kong, Xinjiang, and Canada-China tensions. Use ## for section headers.",
  "narendra-modi": "Write a balanced profile of Narendra Modi for a 16-year-old. Cover his rise, Hindu nationalism, economic policies, treatment of minorities, and Canada-India tensions including the Nijjar affair. Present both supporter and critic views. Use ## for section headers.",
  "greta-thunberg": "Write a profile of Greta Thunberg for a 16-year-old. Cover her Fridays for Future movement, speech at the UN, her impact on climate politics, and criticism she receives. Use ## for section headers.",
  "noam-chomsky": "Write a profile of Noam Chomsky for a 16-year-old. Cover his linguistics work, political philosophy, media criticism, anti-imperialism, and why he's both celebrated and controversial. Use ## for section headers.",
  "ruth-bader-ginsburg": "Write a profile of Ruth Bader Ginsburg for a 16-year-old. Cover her legal career, Supreme Court rulings, gender equality work, cultural legacy, and the political battle over her seat. Use ## for section headers.",
  "emmeline-pankhurst": "Write a profile of Emmeline Pankhurst for a 16-year-old. Cover the suffragette movement, her tactics including civil disobedience, the fight for women's right to vote in the UK and Canada, and her legacy. Use ## for section headers.",
  "frederick-douglass": "Write a profile of Frederick Douglass for a 16-year-old. Cover his escape from slavery, abolitionist writing and speeches, relationship with Lincoln, and his legacy in the civil rights tradition. Use ## for section headers.",
  "john-diefenbaker": "Write a profile of John Diefenbaker for a 16-year-old Canadian. Cover his background, Bill of Rights, vision of Canada, the Avro Arrow cancellation, and his complicated legacy. Use ## for section headers.",
  // Canada & World
  "iran-politics": "Explain Iran's political system to a 16-year-old. Cover the Islamic Republic structure, Supreme Leader vs President, protests like Mahsa Amini, nuclear program, and Canada's sanctions. Use ## for section headers.",
  "gaza-2023": "Explain the Gaza conflict beginning in October 2023 to a 16-year-old. Cover the Hamas attack, Israel's response, the humanitarian crisis, international reactions, Canada's position, and why Canadians are divided. Be strictly balanced. Use ## for section headers.",
  "african-union": "Explain the African Union to a 16-year-old. Cover what it is, how it works, its goals vs reality, key challenges, and why Africa's politics matter to Canada. Use ## for section headers.",
  "taiwan-china": "Explain the Taiwan-China situation to a 16-year-old. Cover why China claims Taiwan, Taiwan's democratic government, US and Canadian positions, risk of conflict, and why this matters globally. Use ## for section headers.",
  "five-eyes": "Explain the Five Eyes intelligence alliance to a 16-year-old Canadian. Cover what it is, how intelligence is shared, privacy concerns, how it affects Canadian foreign policy, and recent controversies. Use ## for section headers.",
  "what-is-wto": "Explain the World Trade Organization to a 16-year-old. Cover what it does, how trade disputes work, Canada's use of it, criticisms from left and right, and whether it's still relevant. Use ## for section headers.",
  "rohingya-crisis": "Explain the Rohingya crisis to a 16-year-old. Cover who the Rohingya are, Myanmar's persecution, the refugee exodus, international response, Canada's role, and the genocide designation. Be factual and respectful. Use ## for section headers.",
  "what-is-asean": "Explain ASEAN to a 16-year-old. Cover which countries are in it, what it does, how it compares to the EU, its limitations, and why Southeast Asia matters to Canada. Use ## for section headers.",
  "arctic-sovereignty": "Explain Canada's Arctic sovereignty to a 16-year-old. Cover what's at stake, competing claims from Russia and the US, climate change opening new routes, Indigenous peoples' role, and why this is increasingly urgent. Use ## for section headers.",
  // Issues
  "sex-work-policy": "Explain sex work policy in Canada to a 16-year-old. Cover the current Nordic model law, what it criminalizes, arguments from sex workers themselves, feminist debates, and different political positions. Present fairly. Use ## for section headers.",
  "vaccine-policy": "Explain vaccine policy and mandates to a 16-year-old Canadian. Cover how vaccine programs work, the COVID mandate debate, Charter implications, arguments for and against mandates, and the Freedom Convoy. Present all perspectives fairly. Use ## for section headers.",
  "youth-voting-rights": "Explain the youth voting rights debate to a 16-year-old Canadian. Cover the current voting age, arguments for lowering it to 16, arguments against, international examples, and how young people can participate before they can vote. Use ## for section headers.",
  "opioid-crisis": "Explain the opioid crisis in Canada to a 16-year-old. Cover how it started, fentanyl's role, BC's decriminalization experiment, safe supply debate, Ontario's approach, and different political positions. Use ## for section headers.",
  "disability-rights": "Explain disability rights and policy to a 16-year-old Canadian. Cover the AODA in Ontario, federal disability benefit, MAID and disability community concerns, accessibility gaps, and different political positions. Use ## for section headers.",
  "mental-health-policy": "Explain mental health policy in Canada to a 16-year-old. Cover how mental healthcare is funded, gaps in OHIP coverage, youth mental health crisis, different political approaches, and what advocacy looks like. Use ## for section headers.",
  "animal-rights": "Explain animal rights as a political issue to a 16-year-old Canadian. Cover current legal protections, factory farming debates, veganism's political dimension, and different positions from animal liberation to conservative views. Use ## for section headers.",
  "nuclear-energy": "Explain the nuclear energy debate to a 16-year-old Canadian. Cover how nuclear works, Ontario's nuclear plants, arguments for nuclear as climate solution, safety and waste concerns, and different political positions. Use ## for section headers.",
  "child-poverty": "Explain child poverty in Canada to a 16-year-old. Cover the data, which communities are most affected, the Canada Child Benefit, what more could be done, and different political positions. Use ## for section headers.",
  // Economy
  "stock-market": "Explain how the stock market works to a 16-year-old Canadian. Cover what stocks are, how the TSX works, why markets go up and down, how it connects to politics and the economy, and whether ordinary people should care. Use ## for section headers.",
  "cryptocurrency": "Explain cryptocurrency to a 16-year-old. Cover what it is, how blockchain works, Bitcoin and Ethereum, environmental concerns, regulatory debates in Canada, and the arguments for and against it as a currency. Use ## for section headers.",
  "how-unions-work": "Explain how labour unions work to a 16-year-old Canadian. Cover what unions do, collective bargaining, strikes, Ontario labour law, major Canadian unions, and arguments for and against unions. Use ## for section headers.",
  "carbon-credits": "Explain carbon credits to a 16-year-old. Cover what they are, how cap-and-trade works, how it differs from a carbon tax, criticisms about greenwashing, and Canada's system. Use ## for section headers.",
  "pensions-canada": "Explain pensions to a 16-year-old Canadian. Cover CPP, OAS, workplace pensions, why the system is under pressure, and why this matters even to young people today. Use ## for section headers.",
  "wealth-gap": "Explain the wealth gap to a 16-year-old Canadian. Cover the difference between income and wealth inequality, Canadian data, how wealth is inherited, political debates about wealth taxes, and why this matters. Use ## for section headers.",
  "foreign-investment": "Explain foreign investment to a 16-year-old Canadian. Cover what it is, how Canada attracts and regulates it, Chinese investment controversies, and the debate between economic openness and national security. Use ## for section headers.",
  // History
  "suffragette-movement": "Explain the suffragette movement to a 16-year-old. Cover the fight for women's right to vote in the UK, Canada, and the US, the tactics used including violence, key figures, and its legacy. Use ## for section headers.",
  "great-depression": "Explain the Great Depression to a 16-year-old. Cover causes, the human toll, Canada's experience including the Dust Bowl, political responses like the New Deal, and how it shaped modern welfare states. Use ## for section headers.",
  "korean-war": "Explain the Korean War to a 16-year-old. Cover why it started, Canada's role, the Chinese intervention, why it ended in stalemate, and why Korea is still divided today. Use ## for section headers.",
  "iranian-revolution": "Explain the Iranian Revolution of 1979 to a 16-year-old. Cover why the Shah fell, how Khomeini took power, the hostage crisis, Iran-Iraq war, and how it shaped the Middle East today. Use ## for section headers.",
  "partition-of-india": "Explain the Partition of India in 1947 to a 16-year-old. Cover why it happened, the mass displacement and violence, creation of Pakistan, the Kashmir conflict, and its ongoing legacy. Be factual and respectful. Use ## for section headers.",
  "troubles-northern-ireland": "Explain the Troubles in Northern Ireland to a 16-year-old. Cover the religious and political conflict, the IRA, British army abuses, the Good Friday Agreement, and why Brexit reopened old tensions. Use ## for section headers.",
  "south-africa-post-apartheid": "Explain what happened in South Africa after apartheid to a 16-year-old. Cover the Truth and Reconciliation Commission, Mandela's presidency, the ANC's failures, inequality today, and lessons for other post-conflict societies. Use ## for section headers.",
  "nuremberg-trials": "Explain the Nuremberg trials to a 16-year-old. Cover what they were, who was tried, the legal principles established, criticisms of victor's justice, and how they created modern international criminal law. Use ## for section headers.",
  "tiananmen-square": "Explain the Tiananmen Square protests of 1989 to a 16-year-old. Cover what protesters wanted, the crackdown, the Tank Man image, how China suppresses this history, and what it tells us about authoritarian governments. Use ## for section headers.",
  "trail-of-tears": "Explain the Trail of Tears to a 16-year-old. Cover the Indian Removal Act, the forced displacement of Indigenous nations, the death toll, and how this connects to broader patterns of settler colonialism including in Canada. Use ## for section headers.",
  "bosnian-war": "Explain the Bosnian War to a 16-year-old. Cover the breakup of Yugoslavia, the siege of Sarajevo, the Srebrenica genocide, NATO's intervention, and what it teaches about international failure to act. Use ## for section headers.",
  // Philosophy & Ethics
  "what-is-democracy": "Explain democracy to a 16-year-old. Cover different types of democracy, how it can fail, illiberal democracy, Canadian examples, and what makes democracy worth defending. Use ## for section headers.",
  "what-is-justice": "Explain different concepts of justice to a 16-year-old. Cover retributive, restorative, and distributive justice, Canadian examples in law and policy, and why people disagree about what fairness means. Use ## for section headers.",
  "what-are-human-rights": "Explain human rights to a 16-year-old Canadian. Cover where the concept comes from, the Universal Declaration, how rights can conflict, Canadian human rights law, and current debates. Use ## for section headers.",
  "civil-disobedience": "Explore civil disobedience for a 16-year-old. Cover the philosophical arguments from Thoreau, MLK, and Gandhi, Canadian examples like pipeline protests and the Freedom Convoy, and how to think about when breaking the law is justified. Use ## for section headers.",
  "social-contract": "Explain the social contract theory to a 16-year-old. Cover Hobbes, Locke, and Rousseau's different versions, how this shapes liberal democracy, and what it means for citizens' rights and responsibilities in Canada. Use ## for section headers.",
  "utilitarianism": "Explain utilitarianism to a 16-year-old. Cover Bentham and Mill's ideas, how it's used in policy decisions, trolley-problem style dilemmas, its strengths, and serious criticisms including minority rights concerns. Use ## for section headers.",
  "just-war-theory": "Explain just war theory to a 16-year-old. Cover the philosophical criteria for a just war, how it applies to Ukraine, Gaza, and Canada's past wars, and arguments from pacifists who reject all war. Use ## for section headers.",
  "what-is-propaganda": "Explain propaganda to a 16-year-old. Cover what it is, historical examples, how it works psychologically, modern social media propaganda, and how to recognize it. Use ## for section headers.",
  "cabinet-government": "Explain how cabinet government works in Canada to a 16-year-old. Cover how cabinet is formed, collective responsibility, the role of ministers, and how real decisions get made. Use ## for section headers.",
  "governor-general": "Explain the role of Canada's Governor General to a 16-year-old. Cover the constitutional powers, the relationship with the Crown, recent controversies, and whether the role still makes sense. Use ## for section headers.",
  "minority-governments": "Explain how minority governments work in Canada to a 16-year-old. Cover what makes a government a minority, confidence votes, supply and confidence agreements, and recent Canadian examples. Use ## for section headers.",
  "prorogation": "Explain prorogation to a 16-year-old Canadian. Cover what it means, who has the power, when it's been used controversially, and why it matters for democracy. Use ## for section headers.",
  "public-services-funding": "Explain how public services are funded in Canada and Ontario to a 16-year-old. Cover federal-provincial transfers, property taxes, user fees, and the debate over funding levels. Use ## for section headers.",
  "ombudsman": "Explain what an ombudsman does to a 16-year-old Canadian. Cover the role, independence, what complaints they handle, Ontario's ombudsman, and why the office matters. Use ## for section headers.",
  "auditor-general": "Explain what auditors general do in Canada to a 16-year-old. Cover federal vs provincial roles, what they audit, landmark reports, and why their independence matters. Use ## for section headers.",
  "coalition-government": "Explain coalition governments to a 16-year-old. Cover how they form, Canadian examples and near-misses, how they differ from minority governments, and arguments for and against. Use ## for section headers.",
  "question-period": "Explain how Question Period works in Canadian legislatures to a 16-year-old. Cover what it's for, how it works in practice, why it's often criticized, and what it reveals about democracy. Use ## for section headers.",
  "what-is-nationalism": "Explain nationalism to a 16-year-old Canadian. Cover core principles, civic vs ethnic nationalism, Quebec nationalism as a Canadian example, strengths and criticisms. Present fairly. Use ## for section headers.",
  "what-is-populism": "Explain populism to a 16-year-old Canadian. Cover what it means, left-wing vs right-wing populism, Canadian and global examples, why it appeals to people, and its dangers for democracy. Use ## for section headers.",
  "what-is-feminism": "Explain feminism to a 16-year-old Canadian. Cover the waves of feminism, core principles, intersectional feminism, major achievements, and current debates. Present both supporter and critic views fairly. Use ## for section headers.",
  "what-is-green-politics": "Explain green politics to a 16-year-old Canadian. Cover core principles, how it differs from environmentalism, Green Party platforms in Canada, tensions with economic growth, and Ontario context. Use ## for section headers.",
  "what-is-neoliberalism": "Explain neoliberalism to a 16-year-old Canadian. Cover core principles, its rise in the 1980s, real-world impacts, how it shaped Canadian policy, and criticisms from left and right. Use ## for section headers.",
  "what-is-communism": "Explain communism to a 16-year-old Canadian. Cover Marx's vision, how it was applied in the USSR, China, and Cuba, where it diverged from theory, and why it's still debated. Present fairly. Use ## for section headers.",
  "what-is-authoritarianism": "Explain authoritarianism to a 16-year-old Canadian. Cover what it means, different forms, historical and current examples, how democracies slide toward it, and warning signs. Use ## for section headers.",
  "what-is-progressivism": "Explain progressivism to a 16-year-old Canadian. Cover core principles, how it differs from liberalism and socialism, Canadian examples, and criticisms from both left and right. Use ## for section headers.",
  "what-is-classical-liberalism": "Explain classical liberalism to a 16-year-old Canadian. Cover its origins, core principles, how it differs from modern liberalism, and its influence on Canadian conservatism. Use ## for section headers.",
  "what-is-christian-democracy": "Explain Christian democracy to a 16-year-old. Cover its origins, core principles, major parties in Europe, its influence on Canadian politics, and the tension between faith and secular governance. Use ## for section headers.",
  "what-is-technocracy": "Explain technocracy to a 16-year-old. Cover what it means, arguments for governing by experts, criticisms about democratic accountability, and real examples in modern government. Use ## for section headers.",
  "mao-zedong": "Write a balanced profile of Mao Zedong for a 16-year-old. Cover the Chinese Revolution, the Great Leap Forward, the Cultural Revolution, the death toll, and why China still officially honours him. Be factual. Use ## for section headers.",
  "simone-de-beauvoir": "Write a profile of Simone de Beauvoir for a 16-year-old. Cover her life, The Second Sex, her relationship with Sartre, how her ideas shaped feminism, and her ongoing relevance. Use ## for section headers.",
  "lester-pearson": "Write a profile of Lester B. Pearson for a 16-year-old Canadian. Cover his role in creating UN peacekeeping, his Nobel Peace Prize, Medicare and the Canadian flag, and his lasting legacy. Use ## for section headers.",
  "rosa-parks": "Write a profile of Rosa Parks for a 16-year-old. Cover her decades of activism before the bus boycott, the Montgomery Bus Boycott strategy, the Civil Rights Movement, and her lasting legacy. Use ## for section headers.",
  "john-a-macdonald": "Write a balanced profile of John A. Macdonald for a 16-year-old Canadian. Cover Confederation, the National Policy, the CPR, the residential school system he helped create, and the ongoing debate about his legacy. Use ## for section headers.",
  "mark-carney": "Write a profile of Mark Carney for a 16-year-old Canadian. Cover his role as Bank of Canada and Bank of England governor, his climate finance work, his entry into Liberal politics, and what he represents. Use ## for section headers.",
  "truth-and-reconciliation": "Explain the Truth and Reconciliation Commission of Canada to a 16-year-old. Cover residential schools, the 94 Calls to Action, what Canada has and hasn't done, and why reconciliation is still contested. Use ## for section headers.",
  "world-bank": "Explain what the World Bank does to a 16-year-old. Cover its structure, what it funds, criticisms about loan conditions, and Canada's role. Use ## for section headers.",
  "imf": "Explain the International Monetary Fund to a 16-year-old. Cover what it does, how it lends to countries in crisis, structural adjustment criticisms, and Canada's role. Use ## for section headers.",
  "cusma-nafta": "Explain CUSMA/NAFTA to a 16-year-old Canadian. Cover what the trade deal does, how it affects Ontario workers and industries, the 2020 renegotiation, and arguments for and against free trade. Use ## for section headers.",
  "canada-afghanistan": "Explain Canada's role in Afghanistan to a 16-year-old. Cover why Canada joined, what Canadian forces did, casualties, the 2021 withdrawal, and the ongoing debate about the mission. Use ## for section headers.",
  "paris-agreement": "Explain the Paris Agreement to a 16-year-old Canadian. Cover what countries agreed to, how it works, whether it's working, Canada's targets and progress, and criticisms from both activists and skeptics. Use ## for section headers.",
  "india-politics": "Explain India's political system to a 16-year-old. Cover its parliamentary democracy, the BJP and Congress parties, the role of caste, religious nationalism, and India-Canada relations. Use ## for section headers.",
  "european-union": "Explain the European Union to a 16-year-old. Cover how it was formed, what it does, the Euro, Brexit, democratic deficit criticisms, and why it matters for Canada. Use ## for section headers.",
  "what-is-brics": "Explain BRICS to a 16-year-old. Cover which countries are in it, what it aims to do, whether it's a real challenge to Western institutions, and Canada's relationship with member countries. Use ## for section headers.",
  "north-korea": "Explain North Korea's political system to a 16-year-old. Cover the Kim dynasty, Juche ideology, the nuclear weapons program, the human rights situation, and why the international community struggles to respond. Use ## for section headers.",
  "housing-crisis-ontario": "Explain Ontario's housing crisis to a 16-year-old. Cover the causes including zoning, speculation, and supply shortages, what the Ford government has done, what critics say, and how it affects young Ontarians. Use ## for section headers.",
  "student-debt-tuition": "Explain student debt and tuition policy in Ontario to a 16-year-old. Cover Ontario's tuition history, OSAP changes, student debt levels, and arguments for and against free post-secondary education. Use ## for section headers.",
  "trans-rights-politics": "Explain trans rights and politics to a 16-year-old Canadian. Cover legal protections in Canada, recent Ontario and federal debates, arguments from different perspectives, and how to engage respectfully. Present multiple perspectives fairly. Use ## for section headers.",
  "indigenous-land-rights": "Explain Indigenous land rights in Canada to a 16-year-old. Cover treaties, unceded territory, recent court decisions, pipeline protests, UNDRIP, and the tension between resource development and Indigenous rights. Use ## for section headers.",
  "carbon-tax": "Explain the carbon tax debate in Canada to a 16-year-old. Cover how it works, what the rebate pays back, arguments for pricing carbon, arguments against, and why it became so politically divisive. Use ## for section headers.",
  "maid-canada": "Explain Medical Assistance in Dying in Canada to a 16-year-old. Cover what it is, who qualifies, how the law has expanded since 2016, arguments for and against, and the debate over mental illness eligibility. Use ## for section headers.",
  "media-bias": "Explain media bias to a 16-year-old Canadian. Cover different types of bias, how to identify it, Canadian media ownership concentration, the difference between news and opinion, and tools for critical consumption. Use ## for section headers.",
  "misinformation-democracy": "Explain misinformation and its effects on democracy to a 16-year-old Canadian. Cover how it spreads, real-world effects on elections and public health, platform responsibility, and what individuals can do. Use ## for section headers.",
  "online-privacy": "Explain online privacy and surveillance to a 16-year-old Canadian. Cover what data is collected and by whom, Canadian privacy laws, government surveillance powers, and arguments between security and privacy. Use ## for section headers.",
  "ai-and-politics": "Explain AI and political power to a 16-year-old. Cover how AI is used in political campaigns, deepfakes and disinformation, AI in government decision-making, and the debate over regulation. Use ## for section headers.",
  "how-inflation-works": "Explain how inflation works to a 16-year-old Canadian. Cover what causes it, how the Bank of Canada measures and responds to it, how it affects everyday life, and the recent post-COVID inflation spike. Use ## for section headers.",
  "bank-of-canada": "Explain the Bank of Canada to a 16-year-old. Cover what it does, how it sets interest rates, its independence from government, quantitative easing, and why it matters to ordinary Canadians. Use ## for section headers.",
  "interest-rates": "Explain how interest rates affect everyday life to a 16-year-old Canadian. Cover how the Bank of Canada sets rates, what happens to mortgages and loans, why rates rise to fight inflation, and the impact on housing. Use ## for section headers.",
  "what-is-recession": "Explain what a recession is to a 16-year-old Canadian. Cover the technical definition, causes, how it affects jobs and services, Canada's recent recessions, and what governments do to respond. Use ## for section headers.",
  "trade-deficits": "Explain trade deficits to a 16-year-old Canadian. Cover what they mean, whether they're actually bad, Canada's trade relationship with the US, and how tariffs and trade wars affect them. Use ## for section headers.",
  "what-is-gdp": "Explain GDP to a 16-year-old Canadian. Cover what it measures, what it misses, how Canada's GDP compares globally, and the debate about whether GDP is still the right way to measure national success. Use ## for section headers.",
  "government-debt": "Explain government debt to a 16-year-old Canadian. Cover how it works, Canada's federal debt, arguments that it's dangerous vs manageable, and how it differs from household debt. Use ## for section headers.",
  "what-is-austerity": "Explain austerity to a 16-year-old Canadian. Cover what it means, historical examples, arguments for cutting spending, arguments that austerity hurts ordinary people, and Ontario's experience with it. Use ## for section headers.",
  "taxes-public-services": "Explain how taxes fund public services in Canada to a 16-year-old. Cover different types of taxes, how money flows between federal and provincial governments, what services depend on taxes, and the debate over tax levels. Use ## for section headers.",
  "quantitative-easing": "Explain quantitative easing to a 16-year-old. Cover what it is, why central banks use it, what happened during COVID, criticisms that it increases inequality, and Canada's experience. Use ## for section headers.",
  "gig-economy": "Explain the gig economy and worker rights to a 16-year-old Canadian. Cover what gig work is, companies like Uber and DoorDash, why workers lack benefits, Ontario's attempts to regulate it, and arguments on both sides. Use ## for section headers.",
  "living-wage": "Explain the living wage concept to a 16-year-old Canadian. Cover how it differs from minimum wage, how living wages are calculated in Ontario cities, which employers pay it, and the debate over mandating it. Use ## for section headers.",
  "supply-chains-politics": "Explain how supply chains affect politics to a 16-year-old. Cover what supply chains are, COVID disruptions, Canada's dependence on the US and China, and the debate over reshoring and economic nationalism. Use ## for section headers.",
  "corporate-tax": "Explain corporate taxes and loopholes to a 16-year-old Canadian. Cover how corporate tax works, Canada's rate, legal tax avoidance vs evasion, offshore accounts, and arguments about what corporations should pay. Use ## for section headers.",
  "economic-nationalism": "Explain economic nationalism to a 16-year-old Canadian. Cover what it means, tariffs and trade barriers, buy-Canadian policies, Canada's response to US tariffs, and arguments for and against. Use ## for section headers.",
  "cold-war": "Explain the Cold War to a 16-year-old Canadian. Cover the US-Soviet rivalry, proxy wars, nuclear arms race, Canada's role including NORAD and the DEW Line, and how it ended. Use ## for section headers.",
  "ww2-politics": "Explain how World War II shaped modern politics to a 16-year-old Canadian. Cover the war's causes, Canada's role, the Holocaust and its lessons, the UN's creation, and how the post-war order still shapes today. Use ## for section headers.",
  "civil-rights-movement": "Explain the American Civil Rights Movement to a 16-year-old. Cover segregation, key figures and events, legislative victories, connections to Canada's own racial history, and its ongoing legacy. Use ## for section headers.",
  "fall-of-soviet-union": "Explain the fall of the Soviet Union to a 16-year-old. Cover Gorbachev's reforms, why the USSR collapsed, what happened to the states that emerged, and how it shaped today's Russia and Ukraine. Use ## for section headers.",
  "canada-ww1": "Explain Canada's role in World War I to a 16-year-old. Cover why Canada entered, Vimy Ridge, the conscription crisis, how the war changed Canada's national identity, and its cost in lives. Use ## for section headers.",
  "october-crisis": "Explain the October Crisis of 1970 to a 16-year-old Canadian. Cover the FLQ, the kidnappings, Trudeau's War Measures Act, the debate over civil liberties vs security, and its legacy for Quebec politics. Use ## for section headers.",
  "apartheid": "Explain apartheid in South Africa to a 16-year-old. Cover what it was, how it was enforced, international opposition including Canada's role, how it ended, and its legacy. Use ## for section headers.",
  "french-revolution": "Explain the French Revolution to a 16-year-old. Cover the causes, key events from 1789 through the Terror, how it shaped democracy and human rights globally, and its legacy. Use ## for section headers.",
  "rwandan-genocide": "Explain the Rwandan Genocide to a 16-year-old. Cover the colonial roots of Hutu-Tutsi tensions, the 1994 genocide, the international community's failure to act, and Rwanda's recovery. Be factual and respectful. Use ## for section headers.",
  "holocaust-human-rights": "Explain how the Holocaust shaped human rights to a 16-year-old. Cover what the Holocaust was, the Nuremberg trials, the creation of the Universal Declaration of Human Rights, and why Never Again is still tested today. Use ## for section headers.",
  "arab-spring": "Explain the Arab Spring to a 16-year-old. Cover what triggered it, which countries saw uprisings, where it led to democracy vs chaos, Syria's civil war, and what it taught about political change. Use ## for section headers.",
  "residential-schools": "Explain residential schools in Canada to a 16-year-old. Cover the system's purpose, the abuse, the Sixties Scoop, the Kamloops discovery, the TRC, and why this history is essential for all Canadians to understand. Use ## for section headers.",
  "vietnam-war": "Explain the Vietnam War to a 16-year-old. Cover why the US got involved, the human cost, Canada's role as draft dodger refuge, the anti-war movement, and why it still shapes American foreign policy. Use ## for section headers.",
  "cuban-missile-crisis": "Explain the Cuban Missile Crisis to a 16-year-old. Cover how it started, how close the world came to nuclear war, how it was resolved, Canada's tense role, and what it teaches about nuclear deterrence. Use ## for section headers.",
  "colonialism-modern-world": "Explain how colonialism shaped the modern world to a 16-year-old Canadian. Cover the scramble for Africa, how borders were drawn, economic extraction, and how colonial structures still shape global inequality today. Use ## for section headers.",
};

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const prompt = MODULE_PROMPTS[slug];
  if (!prompt) return NextResponse.json({ error: "Module not found" }, { status: 404 });

  try {
    // check cache first
    const cached = await sql`
      SELECT content, created_at FROM learn_cache
      WHERE slug = ${slug}
      AND created_at > NOW() - INTERVAL '7 days'
      LIMIT 1
    `;

    if (cached.length > 0) {
      return NextResponse.json({ content: cached[0].content, cached: true });
    }

    const cardPrompt = `${prompt}

Return ONLY a valid JSON array of 8 flashcards. No markdown, no backticks, just raw JSON.

Each card:
{
  "type": "fact" | "quote" | "question" | "stat" | "myth",
  "front": "one punchy sentence or question — max 15 words",
  "back": "2-3 sentences of explanation. Clear, direct, no jargon.",
  "emoji": "one relevant emoji"
}

Last card must be type "question" with front starting with "What do YOU think:" and a provocative Ontario-relevant question on the back.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 2000,
      messages: [{ role: "user", content: cardPrompt }],
    });

    const raw = completion.choices[0]?.message?.content || "";
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("No JSON found");
    const content = match[0];

    await sql`
      INSERT INTO learn_cache (slug, content)
      VALUES (${slug}, ${content})
      ON CONFLICT (slug) DO UPDATE SET content = ${content}, created_at = NOW()
    `;

    return NextResponse.json({ content });
  } catch (err) {
    console.error("learn error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}