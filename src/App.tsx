/*    3RD PARTY IMPORTS   */
import { Button, Input, Layout, notification } from "antd";
import { CopyOutlined, HomeOutlined, UserOutlined } from "@ant-design/icons";
import React, { useEffect, useRef, useState } from "react";
import { SketchPicker } from "react-color";
import CopyToClipboard from "react-copy-to-clipboard";
import socketIOClient from "socket.io-client";

/*    INTERNAL IMPORTS    */
import Loading from "./components/Loading";

/*    VARIABLES   */
const ENDPOINT = "http://localhost:5555";
const socket = socketIOClient.connect(ENDPOINT);
const { Header, Footer, Content } = Layout;
const { TextArea } = Input;
const openNotification = ({ message }: { message: string }) => {
  notification.warning({ message, duration: 4 });
};
const contentStyle = {
  alignItems: "center",
  background: "#eeeeee",
  display: "flex",
  justifyContent: "center",
};
const footerStyle = {
  background: "lime",
  display: "flex",
  margin: 0,
  padding: 0,
};
const headerStyle = {
  background: "catedblue",
  color: "white",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  width: "100%",
  padding: 10,
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [roomId, setRoomId] = useState("");
  const [temporaryRoomId, setTemporaryRoomId] = useState("");
  const [playerCount, setPlayerCount] = useState(0);
  const [playerName, setPlayerName] = useState("");
  const [gameState, setGameState] = useState("initial");
  const [roundType, setRoundType] = useState("");
  const [phrase, setPhrase] = useState("");
  const [lineColor, setLineColor] = useState("#000000");
  const [mouseIsDown, setMouseIsDown] = useState(false);
  const [mouseLocation, setMouseLocation] = useState<{
    previousX: number;
    previousY: number;
  }>();
  const canvasReference = useRef<HTMLCanvasElement>(null);
  const [currentPhrase, setCurrentPhrase] = useState("");
  const [colorPickerIsOpen, setColorPickerIsOpen] = useState(false);
  const [colorPickerColor, setColorPickerColor] = useState("");
  const [context, setContext] = useState<CanvasRenderingContext2D>();

  useEffect(() => {
    socket.on(
      "game-is-ready",
      ({ roundStartType }: { roundStartType: string }) => {
        setGameState("playing");
        // roundStartType = "picture";
        setRoundType(roundStartType);
      }
    );
    socket.on("room-not-found", () =>
      openNotification({ message: "Room not found" })
    );
    socket.on("success", () => {
      setIsLoading(false);
    });
    socket.on("waiting-for-more-players", ({ roomId }: { roomId: string }) => {
      setIsLoading(false);
      setRoomId(roomId);
      setGameState("waiting");
    });
    socket.on("round-is-phrase", ({ picture }: { picture: string }) => {
      console.log(picture);
    });
    socket.on(
      "update-players",
      ({ playerCount: numberOfPlayer }: { playerCount: number }) =>
        setPlayerCount(numberOfPlayer)
    );
    socket.on("waiting-for-players-to-submit", () => setGameState("waiting"));
  }, []);
  useEffect(() => {
    if (roundType === "picture") {
      const canvas = canvasReference && canvasReference.current;
      if (!canvas)
        return openNotification({
          message: "Unable to build canvas for drawing",
        });
      const ctx = canvas.getContext("2d");
      if (!ctx)
        return openNotification({
          message: "Unable to build canvas for drawing",
        });
      ctx.clearRect(0, 0, 300, 600);
      setContext(ctx);
    }
  }, [roundType]);

  /*    HANDLERS    */
  const handleClear = () => {
    context!.clearRect(0, 0, 300, 300);
  };
  const handleCreateRoom = () => {
    if (!playerName)
      return openNotification({ message: "You must first enter your name" });
    setIsLoading(true);
    socket && socket.emit("create-room", { name: playerName });
  };
  const handleDraw = (
    previousX: number,
    previousY: number,
    currentX: number,
    currentY: number
  ) => {
    context!.beginPath();
    context!.moveTo(previousX, previousY);
    context!.lineTo(currentX, currentY);
    context!.lineWidth = 3;
    context!.strokeStyle = lineColor;
    context!.stroke();
  };
  const handleJoinRoom = () => {
    if (!playerName)
      return openNotification({ message: "You must first enter your name" });
    if (!temporaryRoomId)
      return openNotification({ message: "You must first enter a room ID" });
    socket.emit("join-room", { roomId: temporaryRoomId });
  };

  /*    MOUSE EVENT   */
  const handleMouseDown = (event: MouseEvent) => {
    if (roundType !== "picture") return;
    const { x, y } = event;
    const { offsetLeft, offsetTop } = event.target as HTMLElement;
    setMouseLocation({
      previousX: x - offsetLeft,
      previousY: y - offsetTop,
    });
    setMouseIsDown(true);
  };
  const handleMouseMove = (event: MouseEvent) => {
    if (roundType !== "picture") return;
    if (!mouseIsDown) return;
    const { x, y } = event;
    const { offsetLeft, offsetTop } = event.target as HTMLElement;
    const { previousX, previousY } = mouseLocation!;
    setMouseLocation({
      previousX: x - offsetLeft,
      previousY: y - offsetTop,
    });
    handleDraw(previousX, previousY, x - offsetLeft, y - offsetTop);
  };
  const handleMouseUp = (event: MouseEvent) => {
    if (roundType !== "picture") return;
    setMouseIsDown(false);
  };

  /*    TOUCH EVENTS    */
  const handleTouchStart = (event: TouchEvent) => {
    if (roundType !== "picture") return;
    const { clientX, clientY } = event.touches[0];
    const { offsetLeft, offsetTop } = event.target as HTMLElement;
    setMouseLocation({
      previousX: clientX - offsetLeft,
      previousY: clientY - offsetTop,
    });
    setMouseIsDown(true);
  };
  const handleTouchMove = (event: TouchEvent) => {
    if (roundType !== "picture") return;
    if (!mouseIsDown) return;
    const { clientX, clientY } = event.touches[0];
    const { offsetLeft, offsetTop } = event.target as HTMLElement;
    const { previousX, previousY } = mouseLocation!;
    setMouseLocation({
      previousX: clientX - offsetLeft,
      previousY: clientY - offsetTop,
    });
    handleDraw(previousX, previousY, clientX - offsetLeft, clientY - offsetTop);
  };
  const handleTouchEnd = (event: TouchEvent) => {
    if (roundType !== "picture") return;
    setMouseIsDown(false);
  };
  const handleSubmit = () => {
    if (roundType === "phrase") {
      if (!phrase)
        return openNotification({ message: "You must enter a phrase" });
      socket.emit("submit-phrase", { phrase });
      setPhrase("");
    } else {
    }
  };
  return (
    <Layout style={{ height: "100%", width: "100%" }}>
      <Header style={headerStyle}>
        <span>
          <b>Room ID: </b> {roomId}{" "}
          {roomId && (
            <CopyToClipboard
              text={roomId}
              onCopy={() =>
                openNotification({ message: "Room ID copied to clipboard" })
              }
            >
              <CopyOutlined />
            </CopyToClipboard>
          )}
        </span>
        <span>
          <b>Players In Room:</b> {playerCount}
        </span>
      </Header>
      <Content
        style={{ ...contentStyle, flexDirection: "column", overflowY: "auto" }}
      >
        {gameState === "waiting" ? (
          <h1>Waiting for other players...</h1>
        ) : gameState === "playing" ? (
          <span
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: "100%",
              width: 300,
            }}
          >
            <b>{currentPhrase}</b>
            <span
              style={{
                border:
                  roundType === "picture" ? "5px groove cadetblue" : "none",
                display: "flex",
                flexDirection: "column",
                padding: 5,
              }}
            >
              <canvas
                width={300}
                height={300}
                onMouseDown={(event) => handleMouseDown(event.nativeEvent)}
                onTouchStart={(event) => handleTouchStart(event.nativeEvent)}
                onMouseMove={(event) => handleMouseMove(event.nativeEvent)}
                onTouchMove={(event) => handleTouchMove(event.nativeEvent)}
                onMouseUp={(event) => handleMouseUp(event.nativeEvent)}
                onTouchEnd={(event) => handleTouchEnd(event.nativeEvent)}
                ref={canvasReference}
                style={{ background: "#ffffff", boxShadow: "1px 1px 2px grey" }}
              />
              <span
                style={{ display: roundType === "picture" ? "flex" : "none" }}
              >
                <Button block onClick={handleClear}>
                  Clear
                </Button>
                <Button
                  block
                  onClick={() => setColorPickerIsOpen(true)}
                  type="primary"
                >
                  Change Color
                </Button>
              </span>
              {colorPickerIsOpen && (
                <span
                  style={{
                    alignItems: "center",
                    background: "rgba(0, 0, 0, 0.69)",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    justifyContent: "center",
                    left: 0,
                    position: "fixed",
                    top: 0,
                    width: "100%",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <SketchPicker
                      color={colorPickerColor}
                      onChangeComplete={({ hex }: { hex: string }) =>
                        setColorPickerColor(hex)
                      }
                    />
                    <span style={{ display: "flex" }}>
                      <Button block onClick={() => setColorPickerIsOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        block
                        onClick={() => {
                          setLineColor(colorPickerColor);
                          setColorPickerIsOpen(false);
                          setColorPickerColor("");
                        }}
                        type="primary"
                        disabled={!colorPickerColor}
                      >
                        Select
                      </Button>
                    </span>
                  </span>
                </span>
              )}
            </span>
            <span
              style={{
                border:
                  roundType === "phrase" ? "5px groove cadetblue" : "none",
                padding: 5,
                marginBottom: 10,
              }}
            >
              <TextArea
                disabled={!(roundType === "phrase")}
                onChange={(event) => setPhrase(event.target.value)}
                placeholder={roundType === "phrase" ? "Enter phrase here" : ""}
                style={{
                  resize: "none",
                }}
              />
            </span>
          </span>
        ) : (
          <></>
        )}
      </Content>
      <Footer style={{ ...footerStyle, flexDirection: "column" }}>
        {gameState === "initial" ? (
          <>
            <div style={{ display: "flex" }}>
              <Input
                autoFocus
                disabled={isLoading}
                onChange={(event) => setPlayerName(event.target.value)}
                placeholder="Enter Player Name Here"
                prefix={<UserOutlined />}
                type="text"
              />
              <Input
                disabled={isLoading}
                onChange={(event) => setTemporaryRoomId(event.target.value)}
                placeholder="Enter Room ID Here"
                prefix={<HomeOutlined />}
                type="text"
              />
            </div>
            <div style={{ display: "flex" }}>
              <Button
                style={{ border: "none" }}
                block
                disabled={isLoading}
                onClick={handleCreateRoom}
                type="primary"
              >
                Create Room
              </Button>
              <Button
                style={{ border: "none" }}
                block
                disabled={isLoading}
                onClick={handleJoinRoom}
              >
                Join Room
              </Button>
            </div>
          </>
        ) : gameState === "playing" ? (
          <Button
            style={{ border: "none" }}
            type="primary"
            onClick={handleSubmit}
          >
            Submit
          </Button>
        ) : (
          <></>
        )}
      </Footer>
      <Loading isLoading={isLoading} />
    </Layout>
  );
}
