import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface Props {
  code: string;
  language: string;
  showLineNumbers: boolean;
  wrap: boolean;
}

export default function CodeBlockHighlighter({ code, language, showLineNumbers, wrap }: Props) {
  return (
    <SyntaxHighlighter
      language={language}
      style={oneDark}
      showLineNumbers={showLineNumbers}
      wrapLongLines={wrap}
      customStyle={{
        margin: 0,
        padding: "14px 16px",
        background: "transparent",
        fontSize: "13px",
        lineHeight: "1.55",
        color: "#e6e8eb",
        fontFamily:
          'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
      }}
      lineNumberStyle={{
        minWidth: "2.25em",
        paddingRight: "1em",
        color: "#5a6068",
        userSelect: "none",
        fontSize: "11.5px",
      }}
      codeTagProps={{
        style: {
          fontFamily: "inherit",
          whiteSpace: wrap ? "pre-wrap" : "pre",
          wordBreak: wrap ? "break-word" : "normal",
        },
      }}
    >
      {code}
    </SyntaxHighlighter>
  );
}
