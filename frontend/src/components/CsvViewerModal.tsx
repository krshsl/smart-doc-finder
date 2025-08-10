import Papa from "papaparse";
import React, { useEffect, useState } from "react";

interface CsvViewerModalProps {
  url: string;
}

export const CsvViewer: React.FC<CsvViewerModalProps> = ({ url }) => {
  const [data, setData] = useState<string[][]>([]);

  useEffect(() => {
    fetch(url)
      .then((res) => res.text())
      .then((csvText) => {
        const parsed = Papa.parse<string[]>(csvText, { skipEmptyLines: true });
        setData(parsed.data as string[][]);
      });
  }, [url]);

  return (
    <table border={1} cellPadding={5} style={{ width: "100%" }}>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
