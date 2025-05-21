'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Moon, Sun, Play } from 'lucide-react'
import { useTheme } from 'next-themes'
import { CodeEditor } from '@/components/CodeEditor'

const DEFAULT_HTML = '<h1>Hello, Coder!</h1>'
const DEFAULT_CSS = 'body { font-family: sans-serif; padding: 20px; }'
const DEFAULT_JS = 'console.log("Hello from JavaScript!");'
const DEFAULT_REACT = `
const App = () => {
  return <h1>Hello from React!</h1>;
};

ReactDOM.render(<App />, document.getElementById('react-root'));
`;

export default function CodepenClone() {
  const [html, setHtml] = useState(DEFAULT_HTML)
  const [css, setCss] = useState(DEFAULT_CSS)
  const [js, setJs] = useState(DEFAULT_JS)
  const [react, setReact] = useState(DEFAULT_REACT)
  const [consoleOutput, setConsoleOutput] = useState('')
  const [mounted, setMounted] = useState(false)
  const [userBackground, setUserBackground] = useState('')
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleMessage = useCallback((event: MessageEvent) => {
    if (event.data.type === 'console') {
      setConsoleOutput(prev => `${prev}${event.data.content}\n`)
    } else if (event.data.type === 'background') {
      setUserBackground(event.data.color)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [handleMessage])

  const updateOutput = useCallback((executeJs: boolean = false) => {
    const isReactCodePresent = react.trim() !== '' && react.trim() !== DEFAULT_REACT.trim();

    const combinedCode = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              margin: 0;
              background: ${userBackground || (theme === 'dark' ? '#1a1a1a' : '#ffffff')};
              color: ${theme === 'dark' ? '#ffffff' : '#000000'};
            }
            ${css}
          </style>
          <script src="https://unpkg.com/react@17/umd/react.development.js"></script>
          <script src="https://unpkg.com/react-dom@17/umd/react-dom.development.js"></script>
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        </head>
        <body>
          ${html}
          <div id="react-root"></div>
          <script type="text/javascript">
            (function() {
              // Set up console interceptor
              const originalConsole = console.log;
              console.log = function(...args) {
                originalConsole.apply(console, args);
                window.parent.postMessage({
                  type: 'console',
                  content: args.join(' ')
                }, '*');
              };

              // Create a proxy for style changes
              const createStyleProxy = (element) => {
                const originalStyle = element.style;
                return new Proxy(originalStyle, {
                  set: function(target, prop, value) {
                    if (prop === 'background' || prop === 'backgroundColor') {
                      window.parent.postMessage({
                        type: 'background',
                        color: value
                      }, '*');
                    }
                    return Reflect.set(target, prop, value);
                  }
                });
              };

              // Apply the proxy to document.body.style
              document.body.style = createStyleProxy(document.body);

              // Wait for DOM to be fully loaded
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', runCode);
              } else {
                runCode();
              }

              function runCode() {
                // Execute regular JavaScript code
                if (executeJs) {
                  try {
                    ${js}
                  } catch (error) {
                    console.log('JS Error:', error.message);
                  }
                }
                // React code will be transpiled and run by Babel due to the script tag below
              }

              // Wait for DOM to be fully loaded
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', runCode);
              } else {
                runCode();
              }
            })();
          </script>
          <script type="text/babel">
            try {
              ${isReactCodePresent ? react : `ReactDOM.render(null, document.getElementById('react-root'));`}
            } catch (error) {
              console.log('React Error:', error.message);
            }
          </script>
        </body>
      </html>
    `

    const iframe = document.createElement('iframe')
    iframe.srcdoc = combinedCode
    iframe.style.cssText = 'width: 100%; height: 100%; border: none;'

    const outputContainer = document.getElementById('output-container')
    if (outputContainer) {
      outputContainer.innerHTML = ''
      outputContainer.appendChild(iframe)
    }
  }, [html, css, js, react, theme, userBackground, DEFAULT_REACT])

  // Update output when theme changes, but don't re-execute JS
  useEffect(() => {
    if (mounted) {
      updateOutput(false)
    }
  }, [theme, mounted, updateOutput])

  const runCode = useCallback(() => {
    setConsoleOutput('')
    setUserBackground('') // Reset user background when running new code
    updateOutput(true)
  }, [updateOutput])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Codeditor</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="hover:bg-accent"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <CodeEditor language="html" value={html} onChange={setHtml} />
          <CodeEditor language="css" value={css} onChange={setCss} />
          <CodeEditor language="javascript" value={js} onChange={setJs} />
          <CodeEditor language="react" value={react} onChange={setReact} />
        </div>

        <div className="flex justify-center pt-4 mb-4">
          <Button onClick={runCode} className="bg-primary border rounded-lg hover:bg-primary/90">
            <Play className="mr-2 h-4 w-4" /> Run
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">Output</h2>
            <div className="h-64 border rounded-lg overflow-hidden border-border">
              <div id="output-container" className="h-full bg-background" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">Console</h2>
            <pre 
              className="h-64 p-4 border rounded-lg overflow-auto font-mono text-sm border-border bg-muted"
            >
              {consoleOutput}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}