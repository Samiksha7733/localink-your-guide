import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Mic, Send, BookOpen, Volume2, Languages, MapPin, Clock, Loader2 } from "lucide-react";
import { askSarathi } from "@/server/fns";
import type { RankedSpotCard } from "@/lib/engine-types";

export const Route = createFileRoute("/concierge")({
  head: () => ({
    meta: [
      { title: "Sarathi — Hyper-Local AI Travel Guide | Localink" },
      {
        name: "description",
        content:
          "A RAG-powered voice and text concierge trained on Maharashtra's local history, folklore and hidden spots.",
      },
      { property: "og:title", content: "Sarathi — Hyper-Local AI Travel Guide | Localink" },
      {
        property: "og:description",
        content: "Ask in Marathi, Hindi or English — grounded answers with local sources cited.",
      },
    ],
  }),
  component: ConciergePage,
});

type Msg = {
  role: "user" | "guide";
  text: string;
  sources?: string[];
  suggestions?: RankedSpotCard[];
};

const prompts = [
  "What's the story behind Shaniwar Wada?",
  "Where do locals eat in Mumbai after midnight?",
  "Hidden spot near Ellora?",
  "What should I do in Pune at 7 AM?",
  "Best time for Ellora Cave 16?",
  "Suggest more spots in Nashik this evening",
];

function ConciergePage() {
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "guide",
      text: "नमस्कार! I'm Sarathi (Saarthi), your Localink guide. Ask me about any lane, legend, lunch or hour in Maharashtra — I answer from the live spot database and local archive, not the internet's guesswork.",
    },
  ]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);

  const mutation = useMutation({
    mutationFn: (question: string) =>
      askSarathi({
        data: {
          question,
          time: new Date().toTimeString().slice(0, 5),
        },
      }),
  });

  async function ask(question: string) {
    if (!question.trim() || mutation.isPending) return;
    const q = question.trim();
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setInput("");
    try {
      const res = await mutation.mutateAsync(q);
      setMsgs((m) => [
        ...m,
        {
          role: "guide",
          text: res.text,
          sources: res.sources,
          suggestions: res.suggestions,
        },
      ]);
    } catch {
      setMsgs((m) => [
        ...m,
        {
          role: "guide",
          text: "The archive is briefly unreachable. Try again in a moment — I still only answer from Localink's Maharashtra records.",
          sources: ["Localink Sarathi"],
        },
      ]);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Sarathi · voice & text, archive-grounded
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold">Meet Sarathi, your local guide.</h1>
        <p className="mt-3 text-muted-foreground">
          Backed by Localink's Maharashtra database and a time-aware recommendation engine. Ask in
          Marathi, Hindi or English — including “what’s good right now”.
        </p>
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_300px]">
        <section className="flex flex-col rounded-2xl border border-border bg-card shadow-warm">
          <div className="flex-1 space-y-4 p-6">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  m.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.text}</p>
                {m.suggestions && m.suggestions.length > 0 && (
                  <ul className="mt-3 space-y-2 border-t border-border/60 pt-2">
                    {m.suggestions.slice(0, 4).map((s) => (
                      <li key={s.id} className="rounded-xl bg-background/50 px-3 py-2 text-xs">
                        <p className="font-semibold text-foreground">{s.name}</p>
                        <p className="mt-0.5 text-muted-foreground">
                          <MapPin className="mr-1 inline h-3 w-3" />
                          {s.cityName} · {s.reason}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
                {m.sources && (
                  <ul className="mt-3 space-y-1 border-t border-border/60 pt-2 text-[11px] opacity-80">
                    {m.sources.map((s) => (
                      <li key={s} className="inline-flex items-center gap-1">
                        <BookOpen className="h-3 w-3" /> {s}
                      </li>
                    ))}
                  </ul>
                )}
                {m.role === "guide" && (
                  <button type="button" className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                    <Volume2 className="h-3 w-3" /> Play in Marathi
                  </button>
                )}
              </div>
            ))}
            {mutation.isPending && (
              <div className="inline-flex items-center gap-2 rounded-2xl bg-secondary px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Looking up the local archive…
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void ask(input);
            }}
            className="flex items-center gap-2 border-t border-border p-4"
          >
            <button
              type="button"
              onClick={() => setListening((v) => !v)}
              aria-label="Voice input"
              className={`rounded-full p-3 transition-colors ${
                listening ? "bg-sunset text-primary-foreground" : "bg-secondary text-foreground"
              }`}
            >
              <Mic className="h-4 w-4" />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={listening ? "Listening… बोला" : "Ask about a fort, a stall, a festival…"}
              className="flex-1 rounded-full border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-full bg-primary p-3 text-primary-foreground disabled:opacity-50"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>

        <aside className="space-y-3">
          <p className="text-sm font-semibold">Try asking</p>
          {prompts.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => void ask(q)}
              className="w-full rounded-2xl border border-border bg-card p-4 text-left text-sm shadow-warm transition-transform hover:-translate-y-0.5"
            >
              {q}
            </button>
          ))}
          <div className="rounded-2xl border border-border bg-secondary/60 p-4 text-xs text-muted-foreground">
            <p className="inline-flex items-center gap-2 font-semibold text-foreground">
              <Languages className="h-4 w-4" /> मराठी · हिंदी · English
            </p>
            <p className="mt-2">
              Answers are retrieved from the Localink database (spots, peak hours, gazetteer notes)
              and ranked for the current clock time.
            </p>
            <p className="mt-2 inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Time-aware suggestions included when you ask “now”,
              “tonight” or name a city.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
