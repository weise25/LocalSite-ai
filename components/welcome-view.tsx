"use client"

import { useState, useEffect, memo, useMemo, useCallback } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Loader2, ChevronsUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { ProviderSelector } from "@/components/provider-selector"

interface Model {
  id: string
  name: string
}

// -----------------------------------------------------------------------------
// ModelSelector – memoized so it does NOT re-render on prompt changes.
// Uses Popover + Command (Combobox pattern) so the search input stays fixed
// at the top and keeps focus while typing.
// -----------------------------------------------------------------------------

interface ModelSelectorProps {
  models: Model[]
  selectedModel: string
  setSelectedModel: (value: string) => void
  isLoadingModels: boolean
  selectedProvider: string
}

const ModelSelector = memo(function ModelSelector({
  models,
  selectedModel,
  setSelectedModel,
  isLoadingModels,
  selectedProvider,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false)

  const selectedModelName = useMemo(
    () => models.find((m) => m.id === selectedModel)?.name ?? null,
    [models, selectedModel]
  )

  // Filter by both model name and id so searching either works
  const commandFilter = useCallback(
    (value: string, search: string) => {
      const model = models.find((m) => m.id === value)
      if (!model) return 0
      const haystack = `${model.name} ${model.id}`.toLowerCase()
      return haystack.includes(search.toLowerCase()) ? 1 : 0
    },
    [models]
  )

  const isDisabled = !selectedProvider || isLoadingModels

  return (
    <div className="w-full mb-4">
      <label className="block text-sm font-medium text-gray-300 mb-2">SELECT MODEL</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={isDisabled}
            className="w-full justify-between bg-gray-900/80 border-gray-800 hover:bg-gray-900/80 hover:border-gray-800 hover:text-white text-white font-normal h-10 px-3"
          >
            {isLoadingModels ? (
              <span className="flex items-center gap-2 text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading models...
              </span>
            ) : selectedModelName ? (
              <span className="truncate">{selectedModelName}</span>
            ) : (
              <span className="text-gray-500">
                {selectedProvider ? "Choose a model..." : "Select a provider first"}
              </span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 bg-gray-900 border-gray-800 text-white"
          style={{ width: "var(--radix-popover-trigger-width)" }}
          align="start"
        >
          <Command filter={commandFilter} className="bg-gray-900">
            {models.length > 10 && (
              <CommandInput
                placeholder="Search models..."
                className="text-white placeholder:text-gray-500 border-gray-800"
              />
            )}
            <CommandList className="max-h-64">
              <CommandEmpty className="text-gray-400 py-4 text-center text-sm">
                No models found
              </CommandEmpty>
              <CommandGroup>
                {models.map((model) => (
                  <CommandItem
                    key={model.id}
                    value={model.id}
                    onSelect={() => {
                      setSelectedModel(model.id)
                      setOpen(false)
                    }}
                    className="text-gray-300 data-[selected=true]:bg-gray-800 data-[selected=true]:text-white hover:bg-gray-800 hover:text-white cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        selectedModel === model.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{model.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
})

interface WelcomeViewProps {
  prompt: string
  setPrompt: (value: string) => void
  selectedModel: string
  setSelectedModel: (value: string) => void
  selectedProvider: string
  setSelectedProvider: (value: string) => void
  selectedSystemPrompt: string
  setSelectedSystemPrompt: (value: string) => void
  customSystemPrompt: string
  setCustomSystemPrompt: (value: string) => void
  maxTokens: number | undefined
  setMaxTokens: (value: number | undefined) => void
  onGenerate: () => void
}

export function WelcomeView({
  prompt,
  setPrompt,
  selectedModel,
  setSelectedModel,
  selectedProvider,
  setSelectedProvider,
  selectedSystemPrompt,
  setSelectedSystemPrompt,
  customSystemPrompt,
  setCustomSystemPrompt,
  maxTokens,
  setMaxTokens,
  onGenerate
}: WelcomeViewProps) {
  const [titleClass, setTitleClass] = useState("pre-animation")
  const [models, setModels] = useState<Model[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)

  useEffect(() => {
    // Add typing animation class after component mounts
    const timer = setTimeout(() => {
      setTitleClass("typing-animation")
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Load available models when the component mounts or when the provider changes
    const fetchModels = async () => {
      if (!selectedProvider) return;

      // Check sessionStorage cache first
      const cacheKey = `models_${selectedProvider}`
      const cached = sessionStorage.getItem(cacheKey)
      if (cached) {
        const cachedModels = JSON.parse(cached)
        setModels(cachedModels)
        if (cachedModels.length > 0) setSelectedModel(cachedModels[0].id)
        return
      }

      setIsLoadingModels(true)
      setSelectedModel("") // Reset the selected model when the provider changes
      setModels([]) // Clear previous models when changing provider

      try {
        const response = await fetch(`/api/get-models?provider=${selectedProvider}`)

        // Parse the JSON response first to get any error message
        const data = await response.json()

        if (!response.ok) {
          // If the response contains an error message, use it
          if (data && data.error) {
            throw new Error(data.error)
          } else {
            throw new Error('Error fetching models')
          }
        }

        sessionStorage.setItem(cacheKey, JSON.stringify(data))
        setModels(data)

        // Automatically select the first model if available
        if (data.length > 0) {
          setSelectedModel(data[0].id)
        }
      } catch (error) {
        console.error('Error fetching models:', error)

        // Ensure models are cleared when there's an error
        setModels([])
        setSelectedModel("")

        // Display specific error messages based on the provider and error message
        if (error instanceof Error) {
          const errorMessage = error.message

          if (errorMessage.includes('Ollama')) {
            toast.error('Cannot connect to Ollama. Is the server running?')
          } else if (errorMessage.includes('LM Studio')) {
            toast.error('Cannot connect to LM Studio. Is the server running?')
          } else if (selectedProvider === 'deepseek' || selectedProvider === 'openai_compatible') {
            toast.error('Make sure the Base URL and API Keys are correct in your .env.local file.')
          } else {
            toast.error('Models could not be loaded. Please try again later.')
          }
        } else {
          toast.error('Models could not be loaded. Please try again later.')
        }
      } finally {
        setIsLoadingModels(false)
      }
    }

    fetchModels()
  }, [selectedProvider, setSelectedModel])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-black">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black z-0 animate-pulse-slow"></div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center">
        <h1
          className={`text-4xl md:text-6xl font-bold tracking-wider text-white mb-12 ${titleClass}`}
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          WHAT ARE WE BUILDING?
        </h1>

        <div className="relative w-full mb-6">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the website you want to create..."
            className="min-h-[150px] w-full bg-gray-900/80 border-gray-800 focus:border-white focus:ring-white text-white placeholder:text-gray-500 pr-[120px] transition-all duration-300"
          />
          <Button
            onClick={onGenerate}
            disabled={!prompt.trim() || !selectedModel}
            className="absolute bottom-4 right-4 bg-gray-900/90 hover:bg-gray-800 text-white font-medium tracking-wider py-3 px-12 text-base rounded-md transition-all duration-300 border border-gray-800 hover:border-gray-700 focus:border-white focus:ring-white"
          >
            GENERATE
          </Button>
        </div>

        <ProviderSelector
          selectedProvider={selectedProvider}
          setSelectedProvider={setSelectedProvider}
          onProviderChange={() => {}}
        />

        <ModelSelector
          models={models}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          isLoadingModels={isLoadingModels}
          selectedProvider={selectedProvider}
        />

        <div className="w-full mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">SYSTEM PROMPTS</label>
          <Select value={selectedSystemPrompt} onValueChange={setSelectedSystemPrompt}>
            <SelectTrigger className="w-full bg-gray-900/80 border-gray-800 focus:border-white focus:ring-white text-white">
              <SelectValue placeholder="Choose a system prompt..." />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-800 text-white">
              <SelectItem value="default">
                <div className="flex flex-col">
                  <span>Default</span>
                  <span className="text-xs text-gray-400">Standard code generation</span>
                </div>
              </SelectItem>
              <SelectItem value="thinking">
                <div className="flex flex-col">
                  <span>Thinking</span>
                  <span className="text-xs text-gray-400">Makes non thinking models think</span>
                </div>
              </SelectItem>
              <SelectItem value="custom">
                <div className="flex flex-col">
                  <span>Custom System Prompt</span>
                  <span className="text-xs text-gray-400">Specify a custom System Prompt</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedSystemPrompt === 'custom' && (
          <div className="w-full mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">CUSTOM SYSTEM PROMPT</label>
            <Textarea
              value={customSystemPrompt}
              onChange={(e) => setCustomSystemPrompt(e.target.value)}
              placeholder="Enter a custom system prompt to override the default..."
              className="min-h-[100px] w-full bg-gray-900/80 border-gray-800 focus:border-white focus:ring-white text-white placeholder:text-gray-500 transition-all duration-300"
            />
            <p className="mt-1 text-xs text-gray-400">
              Your custom prompt will be used for this generation and subsequent regenerations.
            </p>
          </div>
        )}

        <div className="w-full mb-8">
          <label className="block text-sm font-medium text-gray-300 mb-2">MAX OUTPUT TOKENS</label>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              value={maxTokens || ''}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
                setMaxTokens(value && !isNaN(value) && value > 0 ? value : undefined);
              }}
              placeholder="Default (model dependent)"
              className="w-full bg-gray-900/80 border-gray-800 focus:border-white focus:ring-white text-white placeholder:text-gray-500 transition-all duration-300"
              min="100"
              step="100"
            />
            <Button
              variant="outline"
              onClick={() => setMaxTokens(undefined)}
              className="border-gray-800 hover:bg-gray-800 text-gray-300"
            >
              Reset
            </Button>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Set the maximum number of tokens for the model output. Higher values allow for longer code generation but may take more time. Leave empty to use the model's default.
          </p>
        </div>


      </div>

      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.8;
          }
          50% {
            opacity: 0.6;
          }
        }

        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }

        @keyframes typing {
          from { width: 0 }
          to { width: 100% }
        }

        .pre-animation {
          overflow: hidden;
          white-space: nowrap;
          width: 0;
          border-right: 4px solid transparent;
        }

        .typing-animation {
          overflow: hidden;
          white-space: nowrap;
          border-right: 4px solid #fff;
          animation:
            typing 1.75s steps(40, end),
            blink-caret 0.75s step-end infinite;
        }

        @keyframes blink-caret {
          from, to { border-color: transparent }
          50% { border-color: #fff }
        }
      `}</style>
    </div>
  )
}
