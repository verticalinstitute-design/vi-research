import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getStore } from "@/lib/store";
import { isAdmin } from "@/lib/admin-auth";
import type { Answer, Question, ResponseRow } from "@/lib/types";

function respondentLabel(r: ResponseRow): string {
  if (r.mode === "live") {
    return `${r.session_name || "Live session"} (facilitated by ${r.name})`;
  }
  return `${r.name} · ${r.role}${r.team ? `, ${r.team}` : ""}`;
}

function flatRows(
  questions: Question[],
  responses: ResponseRow[],
  answers: Answer[]
) {
  const rows: Record<string, string>[] = [];
  for (const r of responses) {
    for (const q of questions) {
      const a = answers.find(
        (x) => x.response_id === r.id && x.question_id === q.id
      );
      rows.push({
        Respondent: r.name,
        Role: r.role,
        Team: r.team,
        Mode: r.mode,
        Status: r.status,
        Session: r.session_name ?? "",
        Question: q.code,
        Theme: q.theme,
        Prompt: q.prompt,
        Sources: q.source_refs.join(" "),
        Answer: a?.body ?? "",
        Skipped: a?.is_skipped ? "yes" : "",
        Speaker: a?.speaker ?? "",
      });
    }
  }
  return rows;
}

function toCsv(rows: Record<string, string>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return [
    headers.map(escape).join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h] ?? "")).join(",")),
  ].join("\n");
}

function toMarkdown(
  questions: Question[],
  responses: ResponseRow[],
  answers: Answer[]
): string {
  const lines: string[] = [
    "# VI Research Platform: B2B research answers",
    "",
    `Exported ${new Date().toISOString().slice(0, 10)} · ${responses.length} responses`,
    "",
  ];
  let currentTheme = "";
  for (const q of questions) {
    if (q.theme !== currentTheme) {
      currentTheme = q.theme;
      lines.push(`## ${currentTheme}`, "");
    }
    lines.push(`### ${q.code} · ${q.prompt}`, "");
    lines.push(`_Sources: ${q.source_refs.join(", ") || "none"}_`, "");
    let any = false;
    for (const r of responses) {
      const a = answers.find(
        (x) => x.response_id === r.id && x.question_id === q.id
      );
      if (!a || !a.body.trim()) continue;
      any = true;
      const flags = a.speaker ? `speaker: ${a.speaker}` : "";
      lines.push(
        `**${respondentLabel(r)}**${flags ? ` _(${flags})_` : ""}`,
        "",
        a.body.trim(),
        ""
      );
    }
    if (!any) lines.push("_No answers yet._", "");
  }
  return lines.join("\n");
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const format = req.nextUrl.searchParams.get("format") ?? "csv";
  const store = getStore();
  const [questions, responses, answers] = await Promise.all([
    store.listQuestions(false),
    store.listResponses(),
    store.listAllAnswers(),
  ]);
  const date = new Date().toISOString().slice(0, 10);

  if (format === "md") {
    return new NextResponse(toMarkdown(questions, responses, answers), {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="vi-research-answers-${date}.md"`,
      },
    });
  }

  if (format === "xlsx") {
    const wb = XLSX.utils.book_new();
    const responseRows = responses.map((r) => ({
      Name: r.name,
      Role: r.role,
      Team: r.team,
      Email: r.email,
      Mode: r.mode,
      Session: r.session_name ?? "",
      "Session date": r.session_date ?? "",
      Attendees: r.attendees.join(", "),
      Status: r.status,
      Started: r.created_at,
      Submitted: r.submitted_at ?? "",
    }));
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(responseRows),
      "Responses"
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(flatRows(questions, responses, answers)),
      "Answers"
    );
    const byQuestion = questions.map((q) => {
      const row: Record<string, string> = {
        Code: q.code,
        Prompt: q.prompt,
        Sources: q.source_refs.join(" "),
      };
      for (const r of responses) {
        const a = answers.find(
          (x) => x.response_id === r.id && x.question_id === q.id
        );
        row[respondentLabel(r)] = a?.body ?? "";
      }
      return row;
    });
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(byQuestion),
      "By question"
    );
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(buf, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="vi-research-answers-${date}.xlsx"`,
      },
    });
  }

  return new NextResponse(toCsv(flatRows(questions, responses, answers)), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="vi-research-answers-${date}.csv"`,
    },
  });
}
