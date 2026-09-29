const fs = require("fs");
const path = require("path");

const sourceDir = path.join(__dirname, "extracted", "programes");

const departments = [
  {
    id: "dept_formation",
    slug: "spiritual-formation",
    name: "Spiritual Formation and Kingdom Character",
    category: "Formation",
    summary:
      "Daily devotions, Bible study, prayer, Scripture memorisation, integrity training, counselling, mentorship, servant leadership, family values and Kingdom citizenship.",
    modules: [],
  },
  {
    id: "dept_leadership",
    slug: "leadership-nation-building",
    name: "Leadership and Nation-Building",
    category: "Leadership",
    summary:
      "Biblical leadership, public speaking, communication, community development, civil service ethics, public administration, nation building, stewardship and responsible citizenship.",
    modules: ["Nation Building", "Public Administration"],
  },
  {
    id: "dept_construction",
    slug: "construction-infrastructure",
    name: "Construction and Infrastructure",
    category: "Technical",
    summary:
      "Construction technology, road construction, building construction, survey and site management, basic construction safety, project supervision, site discipline and infrastructure maintenance.",
    modules: ["Construction Technology", "Road Construction", "Building Construction", "Survey and Site Management"],
  },
  {
    id: "dept_mechanical",
    slug: "heavy-equipment-mechanical",
    name: "Heavy Equipment and Mechanical",
    category: "Technical",
    summary:
      "Heavy equipment operations and maintenance, motor vehicle mechanics, workshop safety, preventive maintenance, basic diagnostics, repair discipline and equipment stewardship.",
    modules: ["Heavy Equipment Operations", "Motor Vehicle Mechanics"],
  },
  {
    id: "dept_welding",
    slug: "welding-fabrication",
    name: "Welding and Fabrication",
    category: "Technical",
    summary:
      "Welding basics, fabrication skills, metal work, safety procedures, tool handling, practical workshop assignments, quality control and entrepreneurship in fabrication.",
    modules: ["Welding and Fabrication"],
  },
  {
    id: "dept_agriculture",
    slug: "agriculture-agribusiness",
    name: "Agriculture and Agribusiness",
    category: "Livelihood",
    summary:
      "Crop production, commercial farming, poultry and livestock, fish farming, farm management, agribusiness, food security, cooperative farming and agricultural entrepreneurship.",
    modules: ["Agriculture and Agribusiness", "Poultry and Livestock", "Fish Farming"],
  },
  {
    id: "dept_finance",
    slug: "finance-accounting",
    name: "Finance, Accounting and Cooperative Development",
    category: "Enterprise",
    summary:
      "Basic accounting, record keeping, budgeting, personal financial management, cooperative development, financial stewardship, procurement basics, inventory management and ethical handling of money.",
    modules: ["Finance and Accounting"],
  },
  {
    id: "dept_enterprise",
    slug: "entrepreneurship",
    name: "Entrepreneurship and Business Development",
    category: "Enterprise",
    summary:
      "Business idea generation, business planning, customer service, marketing basics, costing and pricing, small business management, ethical entrepreneurship and business presentation.",
    modules: [],
  },
  {
    id: "dept_hospitality",
    slug: "hospitality-catering",
    name: "Hospitality and Catering",
    category: "Livelihood",
    summary:
      "Hospitality management, catering services, food hygiene, customer relations, housekeeping, event support, service excellence and hospitality entrepreneurship.",
    modules: ["Hospitality Management", "Catering Services"],
  },
  {
    id: "dept_ict",
    slug: "ict-digital-skills",
    name: "ICT, Digital Skills and Artificial Intelligence Awareness",
    category: "Livelihood",
    summary:
      "Basic computer literacy, internet use, email and office tools, digital communication, data entry, ICT for business, artificial intelligence awareness, responsible technology use and digital productivity.",
    modules: ["ICT and Digital Skills", "Artificial Intelligence Awareness"],
  },
  {
    id: "dept_admin",
    slug: "administration-project-management",
    name: "Administration, Human Resource and Project Management",
    category: "Administration",
    summary:
      "Office administration, human resource management, project management, procurement and inventory, report writing, filing and documentation, meeting management and workplace ethics.",
    modules: ["Office Administration", "Project Management"],
  },
  {
    id: "dept_communication",
    slug: "communication",
    name: "Communication and Public Engagement",
    category: "Leadership",
    summary:
      "Communication skills, public speaking, writing skills, presentation skills, media awareness, customer relations, conflict management and professional conduct.",
    modules: ["Communication Skills"],
  },
];

function linesOf(file) {
  return fs.readFileSync(path.join(sourceDir, file), "utf8").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function isHeading(line) {
  return /^\d+(\.\d+)*\.\s+\S/.test(line) && line.length < 100 && !line.endsWith(".");
}

function afterHeading(lines, pattern) {
  const index = lines.findIndex((line) => pattern.test(line));
  if (index === -1) return [];
  const body = [];
  for (let i = index + 1; i < lines.length; i += 1) {
    if (isHeading(lines[i]) && i > index + 1) break;
    body.push(lines[i]);
  }
  return body;
}

function paragraph(body) {
  const text = body.filter((line) => !/^\d+\.\s/.test(line)).join(" ");
  return text.replace(/\s+/g, " ").trim();
}

function aims(body) {
  return body
    .filter((line) => /^\d+\.\s/.test(line))
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .filter((line) => line.length > 12 && line.length < 220)
    .slice(0, 8);
}

const files = fs.readdirSync(sourceDir).filter((file) => file.endsWith(".txt"));
const modules = [];

for (const file of files) {
  const title = file.replace(/\.txt$/, "");
  const department = departments.find((item) => item.modules.includes(title));
  if (!department) throw new Error(`No department for ${title}`);
  const lines = linesOf(file);
  const overviewBody = afterHeading(lines, /Department Overview$|Departmental Vision$/);
  const purposeBody = afterHeading(lines, /Purpose of the Department$|Departmental Mission$/);
  const skillsBody = afterHeading(lines, /Skills Trainees Must Learn$|Practical Skill Outcomes$/);
  const overview = paragraph(overviewBody);
  const purpose = paragraph(purposeBody);
  const skillList = aims(skillsBody);
  const aimList = aims(purposeBody);
  if (!overview) throw new Error(`No overview for ${title}`);
  modules.push({
    title,
    departmentId: department.id,
    file: `/programes/${title}.docx`,
    overview,
    purpose: purpose || overview,
    aims: aimList,
    skills: skillList,
  });
}

const payload = { departments: departments.map(({ modules: names, ...department }) => department), modules };
fs.writeFileSync(path.join(__dirname, "..", "lib", "academy-catalog.json"), JSON.stringify(payload, null, 2));
console.log(`departments ${payload.departments.length} modules ${payload.modules.length}`);
for (const module of payload.modules) {
  console.log(`${module.title} | aims ${module.aims.length} | skills ${module.skills.length} | overview ${module.overview.length}`);
}
