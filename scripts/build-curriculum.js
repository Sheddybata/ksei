const fs = require("fs");
const path = require("path");

const sourceDir = path.join(__dirname, "extracted", "programes");

function clip(text, max = 150) {
  const clean = String(text || "")
    .replace(/\s+/g, " ")
    .replace(/^Day\s+\d+:\s*/i, "")
    .replace(/\.$/, "")
    .trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > 80 ? cut.slice(0, space) : cut).trim()}…`;
}

function scriptureRef(text) {
  const match = String(text).match(/^(\d\s)?([A-Za-z]+(?:\s[A-Za-z]+){0,3})\s+(\d+:\d+)/);
  if (!match) return clip(text, 48);
  return `${match[1] || ""}${match[2]} ${match[3]}`.replace(/\s+/g, " ").trim();
}

function hash(value) {
  let h = 2166136261;
  const text = String(value);
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function uniquePool(items, correct) {
  const seen = new Set([correct.toLowerCase()]);
  const pool = [];
  for (const item of items) {
    const next = clip(item);
    if (next.length < 3) continue;
    const key = next.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    pool.push(next);
  }
  return pool;
}

function makeQuestion(seed, prompt, correctRaw, distractors) {
  const correct = clip(correctRaw);
  if (correct.length < 3) return null;
  const pool = uniquePool(distractors, correct);
  if (pool.length < 3) return null;
  const options = [correct, pool[0], pool[1], pool[2]];
  const rand = mulberry32(hash(seed));
  for (let i = options.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return { prompt, options, correctIndex: options.indexOf(correct) };
}

function parseWeekProgramme(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim());
  const start = lines.findIndex((line) => /^5\.\s+Weekly Topics/.test(line) || /^Weekly Topics for Seven Months/.test(line));
  if (start === -1) return null;
  const months = [];
  let month = null;
  let week = null;
  let section = null;

  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line) continue;
    if (/^PART\b/.test(line)) break;
    if (/^\d+\.\s+[A-Z]/.test(line) && !/^Day\s+\d+/.test(line.replace(/^\d+\.\s+/, "")) && month && !week) break;
    if (/^\d+\.\s+[A-Z]/.test(line) && !/Day\s+\d+/.test(line) && section && section !== "practical" && week && months.length) {
      const looksLikeHeading = line.length < 80 && !line.includes(":");
      if (looksLikeHeading) break;
    }

    const monthMatch = line.match(/^Month\s+(\d+):\s*(.+)$/);
    if (monthMatch) {
      month = { order: Number(monthMatch[1]), title: monthMatch[2].trim(), weeks: [] };
      months.push(month);
      week = null;
      section = null;
      continue;
    }
    const weekMatch = line.match(/^Week\s+(\d+):\s*(.+)$/);
    if (weekMatch && month) {
      week = {
        number: Number(weekMatch[1]),
        title: weekMatch[2].trim(),
        focus: "",
        scripture: "",
        practicals: [],
        character: "",
      };
      month.weeks.push(week);
      section = null;
      continue;
    }
    if (!week) continue;
    if (line === "Teaching Focus") {
      section = "focus";
      continue;
    }
    if (line === "Scripture for the Week") {
      section = "scripture";
      continue;
    }
    if (line === "Daily Practical Activities") {
      section = "practical";
      continue;
    }
    if (line === "Character Lesson") {
      section = "character";
      continue;
    }
    if (section === "focus") week.focus = `${week.focus} ${line}`.trim();
    else if (section === "scripture") week.scripture = `${week.scripture} ${line}`.trim();
    else if (section === "character") week.character = `${week.character} ${line}`.trim();
    else if (section === "practical") {
      const item = line.replace(/^\d+\.\s*/, "").trim();
      if (item) week.practicals.push(item);
    }
  }

  return months.filter((item) => item.weeks.length);
}

function parseScheduleProgramme(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim());
  const start = lines.findIndex((line) => line === "PRACTICAL TRAINING SCHEDULE");
  if (start === -1) return null;
  const months = [];
  let month = null;
  let section = null;

  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line) continue;
    if (/^PART\b/.test(line)) break;
    const monthMatch = line.match(/^Month\s+(\d+):\s*(.+)$/);
    if (monthMatch) {
      month = { order: Number(monthMatch[1]), title: monthMatch[2].trim(), focus: [], practicals: [], checks: [] };
      months.push(month);
      section = null;
      continue;
    }
    if (!month) continue;
    if (line === "Key Focus") {
      section = "focus";
      continue;
    }
    if (line === "Practical Activities") {
      section = "practical";
      continue;
    }
    if (line === "Assessment") {
      section = "checks";
      continue;
    }
    if (line === "Character Focus") {
      section = null;
      continue;
    }
    const item = line.replace(/^\d+\.\s*/, "").trim();
    if (!item || !section) continue;
    month[section === "focus" ? "focus" : section === "practical" ? "practicals" : "checks"].push(item);
  }

  return months;
}

function otherWeeks(months, monthOrder) {
  return months.filter((month) => month.order !== monthOrder).flatMap((month) => month.weeks || []);
}

function questionsForWeeks(title, months, month) {
  const others = otherWeeks(months, month.order);
  const focuses = others.map((week) => week.focus);
  const practicals = others.flatMap((week) => week.practicals);
  const scriptures = others.map((week) => scriptureRef(week.scripture));
  const characters = others.map((week) => week.character);
  const weeks = month.weeks;
  const pick = (index) => weeks[index % weeks.length];

  const planned = [
    {
      week: pick(0),
      build: (week) =>
        makeQuestion(
          `${title}-${month.order}-focus`,
          `In “${week.title}”, what is the teaching focus?`,
          week.focus,
          focuses,
        ),
    },
    {
      week: pick(1),
      build: (week) =>
        makeQuestion(
          `${title}-${month.order}-practice`,
          `Which practical belongs to “${week.title}”?`,
          week.practicals[0],
          practicals,
        ),
    },
    {
      week: pick(2),
      build: (week) =>
        makeQuestion(
          `${title}-${month.order}-scripture`,
          `Which scripture is assigned to “${week.title}”?`,
          scriptureRef(week.scripture),
          scriptures,
        ),
    },
    {
      week: pick(Math.min(3, weeks.length - 1)),
      build: (week) =>
        makeQuestion(
          `${title}-${month.order}-character`,
          `What character lesson closes “${week.title}”?`,
          week.character,
          characters,
        ),
    },
  ];

  const questions = [];
  for (const item of planned) {
    let question = item.build(item.week);
    if (!question) {
      for (const week of weeks) {
        question = item.build(week);
        if (question) break;
      }
    }
    if (!question) {
      throw new Error(`Could not build a question for ${title} module ${month.order}`);
    }
    questions.push(question);
  }
  return questions;
}

function questionsForSchedule(title, months, month) {
  const others = months.filter((item) => item.order !== month.order);
  const planned = [
    makeQuestion(
      `${title}-${month.order}-focus`,
      "Which of these is a key focus of this module?",
      month.focus[0],
      others.flatMap((item) => item.focus),
    ),
    makeQuestion(
      `${title}-${month.order}-practice`,
      "Which practical belongs to this module?",
      month.practicals[0],
      others.flatMap((item) => item.practicals),
    ),
    makeQuestion(
      `${title}-${month.order}-check`,
      "Which workshop check is set for this module?",
      month.checks[0],
      others.flatMap((item) => item.checks),
    ),
    makeQuestion(
      `${title}-${month.order}-focus-2`,
      "Which other point is taught in this module?",
      month.focus[1] || month.practicals[1],
      others.flatMap((item) => [...item.focus, ...item.practicals]),
    ),
  ];
  planned.forEach((question, index) => {
    if (!question) throw new Error(`Could not build schedule question ${index + 1} for ${title} module ${month.order}`);
  });
  return planned;
}

function contentForWeeks(month) {
  const intro = `Module ${month.order} of 7. ${month.title}\n\nRead each section in order. Mark the module complete, then pass the checkpoint with at least 70 percent. The next module stays locked until you do.`;
  const weeks = month.weeks.map((week) => {
    const blocks = [`Week ${week.number}. ${week.title}`];
    if (week.focus) blocks.push(`Teaching focus\n${week.focus}`);
    if (week.scripture) blocks.push(`Scripture\n${week.scripture.replace(/(\d:\d+)([“"'])/g, "$1 $2")}`);
    if (week.practicals.length) blocks.push(`Practice\n${week.practicals.join("\n")}`);
    if (week.character) blocks.push(`Character\n${week.character}`);
    return blocks.join("\n\n");
  });
  return [intro, ...weeks].join("\n\n");
}

function contentForSchedule(month) {
  const blocks = [
    `Module ${month.order} of 7. ${month.title}`,
    "Read this module, mark it complete, then pass the checkpoint with at least 70 percent. The next module stays locked until you do.",
    `Key focus\n${month.focus.map((item, index) => `${index + 1}. ${item}`).join("\n")}`,
    `Practice\n${month.practicals.map((item, index) => `${index + 1}. ${item}`).join("\n")}`,
  ];
  if (month.checks.length) {
    blocks.push(`Workshop checks\n${month.checks.map((item, index) => `${index + 1}. ${item}`).join("\n")}`);
  }
  return blocks.join("\n\n");
}

const files = fs.readdirSync(sourceDir).filter((file) => file.endsWith(".txt"));
const courses = [];

for (const file of files) {
  const title = file.replace(/\.txt$/, "");
  const text = fs.readFileSync(path.join(sourceDir, file), "utf8");
  const weeks = parseWeekProgramme(text);
  const schedule = weeks && weeks.length >= 7 ? null : parseScheduleProgramme(text);
  const months = weeks && weeks.length >= 7 ? weeks : schedule;
  if (!months || months.length < 7) {
    throw new Error(`${title} produced ${months ? months.length : 0} modules`);
  }
  const selected = months.slice(0, 7);
  const modules = selected.map((month) => {
    const scheduleMode = Boolean(month.focus && !month.weeks);
    const questions = scheduleMode ? questionsForSchedule(title, selected, month) : questionsForWeeks(title, selected, month);
    return {
      order: month.order,
      title: month.title,
      content: scheduleMode ? contentForSchedule(month) : contentForWeeks(month),
      quiz: {
        title: `Module ${month.order} test`,
        instructions: `This checkpoint covers ${month.title}. Score at least 70 percent to unlock the next module. You can try again if you miss the pass mark.`,
        questions,
      },
    };
  });
  courses.push({ title, modules });
  const weeksCount = selected.reduce((sum, month) => sum + (month.weeks ? month.weeks.length : 0), 0);
  console.log(`${title}: ${modules.length} modules, ${weeksCount || "schedule"} sections, ${modules.reduce((sum, module) => sum + module.quiz.questions.length, 0)} questions`);
}

courses.sort((a, b) => a.title.localeCompare(b.title));
const out = path.join(__dirname, "..", "lib", "curriculum.json");
fs.writeFileSync(out, JSON.stringify({ courses }, null, 2));
console.log(`wrote ${courses.length} courses`);
