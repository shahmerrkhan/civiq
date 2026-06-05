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