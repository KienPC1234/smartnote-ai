import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Flame, Zap, GitMerge, AlertTriangle } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface NeuralInsightsProps {
    generation: {
        devilsAdvocateMd?: string | null;
        metaphorsMd?: string | null;
        connectionsMd?: string | null;
        weakspotsMd?: string | null;
    };
}

export default function NeuralInsights({ generation }: NeuralInsightsProps) {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Devil's Advocate */}
                <Card className="border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_var(--primary)] bg-white dark:bg-zinc-900">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-2xl font-black uppercase italic text-black dark:text-white">
                            <Flame className="w-6 h-6 text-[var(--primary)]" />
                            Devil's Advocate
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-zinc dark:prose-invert font-medium">
                        <ReactMarkdown>
                            {generation.devilsAdvocateMd || "No critical challenges generated."}
                        </ReactMarkdown>
                    </CardContent>
                </Card>

                {/* Metaphor Magic */}
                <Card className="border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_var(--secondary)] bg-white dark:bg-zinc-900">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-2xl font-black uppercase italic text-black dark:text-white">
                            <Zap className="w-6 h-6 text-[var(--secondary)]" />
                            Metaphor Magic
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-zinc dark:prose-invert font-medium">
                        <ReactMarkdown>
                            {generation.metaphorsMd || "No metaphors generated."}
                        </ReactMarkdown>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {/* Cross-Pollination */}
                 <Card className="border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_var(--accent)] bg-white dark:bg-zinc-900">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-2xl font-black uppercase italic text-black dark:text-white">
                            <GitMerge className="w-6 h-6 text-[var(--accent)]" />
                            Cross-Pollination
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-zinc dark:prose-invert font-medium">
                        <ReactMarkdown>
                            {generation.connectionsMd || "No interdisciplinary connections found."}
                        </ReactMarkdown>
                    </CardContent>
                </Card>

                {/* Knowledge Gaps (Moved here from NoteDetailClient) */}
                <Card className="border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_#a78bfa] bg-white dark:bg-zinc-900">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-2xl font-black uppercase italic text-black dark:text-white">
                            <AlertTriangle className="w-6 h-6 text-[#a78bfa]" />
                            Knowledge Gaps
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-zinc dark:prose-invert font-medium">
                         <ReactMarkdown>
                            {generation.weakspotsMd || "No knowledge gaps detected."}
                        </ReactMarkdown>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
