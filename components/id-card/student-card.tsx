"use client";

import { useEffect, useState, type CSSProperties } from "react";
import QRCode from "qrcode";
import { Mark } from "@/components/brand/logo";
import { formatDate, initials } from "@/lib/format";

export type CardStudent = {
  id: string;
  name: string;
  studentNumber: string;
  program: string;
  photoUrl: string | null;
  issueDate: string;
  status: string;
};

const WIDTH = 307;
const HEIGHT = 486;

export function StudentIdCard({ student, side }: { student: CardStudent; side: "front" | "back" }) {
  const [qr, setQr] = useState("");
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify/${student.studentNumber}`;

  useEffect(() => {
    if (side !== "front") return;
    let active = true;
    QRCode.toDataURL(verifyUrl, {
      margin: 0,
      width: 240,
      errorCorrectionLevel: "M",
      color: { dark: "#123B5D", light: "#FFFFFF" },
    })
      .then((url) => {
        if (active) setQr(url);
      })
      .catch(() => {
        if (active) setQr("");
      });
    return () => {
      active = false;
    };
  }, [side, verifyUrl]);

  if (side === "back") {
    return (
      <article data-card="back" className="id-card" style={shell("#F7F3E8", "#123B5D")}>
        <div>
          <p style={kicker}>King Solomon Empowerment Initiative</p>
          <h3 style={{ margin: "8px 0 0", fontFamily: "Georgia, serif", fontSize: 26, lineHeight: 1.15 }}>This identity card</h3>
          <p style={body}>
            This card identifies an enrolled trainee. It is the property of the King Solomon Empowerment Initiative and is valid only for the person named on the front.
          </p>
          <p style={{ ...body, marginTop: 16, fontWeight: 700 }}>If this card is found</p>
          <p style={body}>
            Please return it to the Administrator, or report it to info@ksei.org.ng. You may also hand it in through ksei.org.ng. Do not use a card that is not yours.
          </p>
        </div>
        <div>
          <div style={{ width: 148, height: 1, background: "#C9A227", marginBottom: 8 }} />
          <p
            style={{
              margin: 0,
              fontFamily: '"Segoe Script", "Brush Script MT", "Snell Roundhand", cursive',
              fontSize: 28,
              lineHeight: 1,
              color: "#0C2A43",
            }}
          >
            Juliet Ebine
          </p>
          <p style={{ ...kicker, marginTop: 8 }}>Dr. Juliet Ebine</p>
          <p style={{ margin: "4px 0 0", fontFamily: "Outfit, sans-serif", fontSize: 12 }}>Administrator</p>
        </div>
      </article>
    );
  }

  return (
    <article data-card="front" className="id-card" style={shell("#123B5D", "#F7F3E8")}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <Mark size={36} />
        <div>
          <p style={{ margin: 0, fontFamily: "Georgia, serif", fontSize: 18 }}>KSEI</p>
          <p style={{ ...kicker, color: "#E6D7A2" }}>Student identity</p>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10 }}>
        <Portrait name={student.name} photoUrl={student.photoUrl} />
        <div>
          <h3 style={{ margin: 0, fontFamily: "Georgia, serif", fontSize: 26, lineHeight: 1.15 }}>{student.name}</h3>
          <p style={{ margin: "8px 0 0", fontFamily: "Outfit, sans-serif", letterSpacing: "0.08em", fontSize: 13 }}>{student.studentNumber}</p>
          <p style={{ margin: "6px 0 0", fontFamily: "Outfit, sans-serif", fontSize: 13, lineHeight: 1.35, color: "#E6D7A2" }}>{student.program}</p>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "#fff",
          color: "#123B5D",
          borderRadius: 12,
          padding: 8,
        }}
      >
        <div style={{ width: 78, height: 78, flexShrink: 0, background: "#fff" }}>
          {qr ? <img src={qr} alt="" width={78} height={78} /> : null}
        </div>
        <div style={{ fontFamily: "Outfit, sans-serif", minWidth: 0 }}>
          <p style={{ ...kicker, color: "#8C7014" }}>Scan to verify</p>
          <p style={{ margin: "4px 0 0", fontSize: 12, fontWeight: 700 }}>{student.studentNumber}</p>
          <p style={{ margin: "2px 0 0", fontSize: 11 }}>Issued {formatDate(student.issueDate)}</p>
        </div>
      </div>
    </article>
  );
}

function Portrait({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  if (photoUrl && !photoUrl.endsWith(".svg")) {
    return (
      <img
        src={photoUrl}
        alt=""
        width={112}
        height={136}
        style={{ width: 112, height: 136, objectFit: "cover", borderRadius: 14, border: "2px solid #C9A227" }}
      />
    );
  }
  return (
    <div
      style={{
        width: 112,
        height: 136,
        borderRadius: 14,
        border: "2px solid #C9A227",
        background: "#0C2A43",
        color: "#C9A227",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Georgia, serif",
        fontSize: 32,
        fontWeight: 700,
      }}
    >
      {initials(name)}
    </div>
  );
}

function shell(background: string, color: string): CSSProperties {
  return {
    width: WIDTH,
    height: HEIGHT,
    background,
    color,
    borderRadius: 18,
    boxSizing: "border-box",
    padding: 18,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden",
    boxShadow: "inset 0 0 0 3px #C9A227",
    flexShrink: 0,
  };
}

const kicker: CSSProperties = {
  margin: 0,
  fontFamily: "Outfit, sans-serif",
  fontSize: 10,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  fontWeight: 700,
};

const body: CSSProperties = {
  margin: "10px 0 0",
  fontFamily: "Outfit, sans-serif",
  fontSize: 13,
  lineHeight: 1.5,
};
