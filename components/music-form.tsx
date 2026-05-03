"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

const SAMPLE_RATES = [
  { value: "16000", label: "16 kHz" },
  { value: "24000", label: "24 kHz" },
  { value: "32000", label: "32 kHz" },
  { value: "44100", label: "44.1 kHz" },
] as const

const BITRATES = [
  { value: "32000", label: "32 kbps" },
  { value: "64000", label: "64 kbps" },
  { value: "128000", label: "128 kbps" },
  { value: "256000", label: "256 kbps" },
] as const

const FORMATS = ["mp3", "wav"] as const

export function MusicForm() {
  const [isInstrumental, setIsInstrumental] = useState(false)
  const [lyricsOptimizer, setLyricsOptimizer] = useState(false)

  return (
    <Tabs className="flex min-h-0 flex-col gap-0" defaultValue="compose">
      <CardHeader
        className="sticky top-0 z-10 border-border/70 border-b bg-background"
        style={{ paddingBottom: 0 }}
      >
        <TabsList variant="line">
          <TabsTrigger value="compose">Compose</TabsTrigger>
        </TabsList>
      </CardHeader>

      <TabsContent className="flex min-h-0 flex-1 flex-col" value="compose">
        <form className="flex min-h-0 flex-1 flex-col">
          <CardContent className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            <FieldGroup>
              <Field>
                <FieldLabel>Model</FieldLabel>
                <Select defaultValue="minimax/music-2.6" disabled>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimax/music-2.6">
                      MiniMax Music 2.6
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <FieldSeparator />

              <Field>
                <FieldLabel htmlFor="prompt">Prompt</FieldLabel>
                <FieldDescription>
                  Describe the music style, mood, and scenario you want. Include
                  genre, tempo, instruments, and emotional tone for best
                  results.
                </FieldDescription>
                <Textarea
                  id="prompt"
                  placeholder="e.g. An upbeat electronic dance track with synthesizer leads, driving 128 BPM tempo, and euphoric breakdowns perfect for a summer festival…"
                  rows={6}
                  spellCheck={false}
                />
              </Field>

              <FieldSeparator />

              <Field orientation="horizontal">
                <div className="flex flex-1 flex-col gap-0.5">
                  <FieldLabel htmlFor="isInstrumental">Instrumental</FieldLabel>
                  <FieldDescription>
                    Generate instrumental music with no vocals.
                  </FieldDescription>
                </div>
                <Switch
                  checked={isInstrumental}
                  id="isInstrumental"
                  onCheckedChange={setIsInstrumental}
                />
              </Field>

              {!isInstrumental && (
                <>
                  <Field orientation="horizontal">
                    <div className="flex flex-1 flex-col gap-0.5">
                      <FieldLabel htmlFor="lyricsOptimizer">
                        Lyrics Optimizer
                      </FieldLabel>
                      <FieldDescription>
                        Automatically generate lyrics based on the prompt
                        description.
                      </FieldDescription>
                    </div>
                    <Switch
                      checked={lyricsOptimizer}
                      id="lyricsOptimizer"
                      onCheckedChange={setLyricsOptimizer}
                    />
                  </Field>

                  {!lyricsOptimizer && (
                    <Field>
                      <FieldLabel htmlFor="lyrics">Lyrics</FieldLabel>
                      <FieldDescription>
                        Song lyrics. Use line breaks to separate lines.
                      </FieldDescription>
                      <Textarea
                        id="lyrics"
                        placeholder={
                          "e.g. Verse 1:\nUnder the neon lights we dance\nLost in a midnight trance\n\nChorus:\nWe are alive, we are free…"
                        }
                        rows={8}
                        spellCheck={false}
                      />
                    </Field>
                  )}
                </>
              )}

              <FieldSeparator />

              <Field>
                <FieldLabel>Sample Rate</FieldLabel>
                <FieldDescription>
                  Audio sample rate. Higher rates preserve more frequency detail
                  but produce larger files.
                </FieldDescription>
                <ToggleGroup
                  defaultValue="44100"
                  type="single"
                  variant="outline"
                >
                  {SAMPLE_RATES.map((rate) => (
                    <ToggleGroupItem key={rate.value} value={rate.value}>
                      {rate.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Field>

              <Field>
                <FieldLabel>Bitrate</FieldLabel>
                <FieldDescription>
                  Audio bitrate. Higher bitrates produce better quality at the
                  cost of file size.
                </FieldDescription>
                <ToggleGroup
                  defaultValue="128000"
                  type="single"
                  variant="outline"
                >
                  {BITRATES.map((rate) => (
                    <ToggleGroupItem key={rate.value} value={rate.value}>
                      {rate.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Field>

              <Field>
                <FieldLabel>Format</FieldLabel>
                <FieldDescription>Output audio format.</FieldDescription>
                <ToggleGroup defaultValue="mp3" type="single" variant="outline">
                  {FORMATS.map((fmt) => (
                    <ToggleGroupItem key={fmt} value={fmt}>
                      {fmt.toUpperCase()}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Field>
            </FieldGroup>
          </CardContent>

          <CardFooter className="sticky bottom-0 mt-0 flex flex-col gap-3 border-border/70 border-t bg-background px-4 pt-4 pb-4 sm:px-5">
            <Button className="w-full" type="button">
              Generate Music
            </Button>
          </CardFooter>
        </form>
      </TabsContent>
    </Tabs>
  )
}
