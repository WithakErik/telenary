/*    3RD PARTY IMPORTS   */
import { Button, Input, Layout, notification } from "antd";
import { CopyOutlined, HomeOutlined, UserOutlined } from "@ant-design/icons";
import React, { useEffect, useRef, useState } from "react";
import { SketchPicker } from "react-color";
import CopyToClipboard from "react-copy-to-clipboard";
import socketIOClient from "socket.io-client";

/*    INTERNAL IMPORTS    */
import Loading from "./components/Loading";

/*    TYPES   */
type Card = {
  content: string;
  playerName: string;
  type: "phrase" | "picture";
};
type Stack = {
  cards: Card[];
};

/*    VARIABLES   */
const ENDPOINT = "http://localhost/";
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

/*    TODO:

Handle when a player leaves mid game
*/

export default function App() {
  const canvasReference = useRef<HTMLCanvasElement>(null);
  const [colorPickerColor, setColorPickerColor] = useState("");
  const [colorPickerIsOpen, setColorPickerIsOpen] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D>();
  const [currentPhrase, setCurrentPhrase] = useState("");
  const [currentStackIndex, setCurrentStackIndex] = useState(0);
  const [gameState, setGameState] = useState("initial");
  const [isLoading, setIsLoading] = useState(true);
  const [lineColor, setLineColor] = useState("#000000");
  const [mouseIsDown, setMouseIsDown] = useState(false);
  const [mouseLocation, setMouseLocation] = useState<{
    previousX: number;
    previousY: number;
  }>();
  const [playerCount, setPlayerCount] = useState(0);
  const [playerName, setPlayerName] = useState("");
  const [phrase, setPhrase] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roundType, setRoundType] = useState("");
  const [stacks, setStacks] = useState<Stack[]>();

  // Add ability to Undo
  const [strokeHistory, setStrokeHistory] = useState<string[]>([]);
  const [temporaryRoomId, setTemporaryRoomId] = useState("");

  useEffect(() => {
    socket.on("begin-new-round", (data: Card) => {
      setGameState("playing");
      if (data.type === "phrase") {
        setRoundType("picture");
        setCurrentPhrase(data.content);
      } else {
        setRoundType("phrase");
        const canvas = canvasReference && canvasReference.current;
        const context = canvas!.getContext("2d");
        const image = new Image();
        image.src = data.content;
        image.onload = () => {
          context!.drawImage(image, 0, 0);
        };
      }
    });
    socket.on("duplicate-player-name", () =>
      openNotification({
        message: "A player with that name is already in the room",
      })
    );
    socket.on("game-already-started", () => setGameState("busy"));
    socket.on("game-has-finished", (stacks: any) => {
      setStacks(stacks);
      console.log("[ stacks ]", stacks);
      setGameState("reviewing");
    });
    socket.on("game-has-finished", (stacks: Stack[]) => {
      setStacks(stacks);
    });
    socket.on(
      "game-is-ready",
      ({
        roomId,
        roundStartType,
      }: {
        roomId: string;
        roundStartType: string;
      }) => {
        setGameState("playing");
        setRoundType(roundStartType);
        setRoomId(roomId);
      }
    );
    socket.on("room-not-found", () =>
      openNotification({ message: "Room not found" })
    );
    socket.on("success", () => {
      setIsLoading(false);
    });
    socket.on(
      "update-players",
      ({ playerCount: numberOfPlayer }: { playerCount: number }) =>
        setPlayerCount(numberOfPlayer)
    );
    socket.on("waiting-for-more-players", ({ roomId }: { roomId: string }) => {
      setIsLoading(false);
      setRoomId(roomId);
      setGameState("waiting");
    });
    socket.on("waiting-for-players-to-submit", () => setGameState("waiting"));
  }, []);
  useEffect(() => {
    if (roundType === "picture") {
      const canvas = canvasReference && canvasReference.current;
      if (!canvas)
        return openNotification({
          message: "Unable to build canvas for drawing",
        });
      const context = canvas.getContext("2d");
      if (!context)
        return openNotification({
          message: "Unable to build canvas for drawing",
        });
      context.clearRect(0, 0, 300, 600);
      setContext(context);
    }
  }, [roundType]);

  /*    HANDLERS    */
  const handleClear = (undo?: boolean) => {
    if (undo) {
      const history: string[] = strokeHistory as string[];
      const canvas = canvasReference && canvasReference.current;
      const image = canvas!.toDataURL("image/png");
      history.push(image);
      setStrokeHistory(history);
    }
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
  const handleFinishDraw = () => {
    if (roundType !== "picture") return;
    setMouseIsDown(false);
    if (mouseIsDown) {
      const canvas = canvasReference && canvasReference.current;
      const image = canvas!.toDataURL("iamge/png");
      const history = strokeHistory;
      history.push(image);
      setStrokeHistory(history);
      setMouseIsDown(false);
    }
  };
  const handleJoinRoom = () => {
    if (!playerName)
      return openNotification({ message: "You must first enter your name" });
    if (!temporaryRoomId)
      return openNotification({ message: "You must first enter a room ID" });
    socket.emit("join-room", { name: playerName, roomId: temporaryRoomId });
  };
  const handleNextStack = () => {
    if (currentStackIndex >= stacks!.length - 1)
      return setCurrentStackIndex(stacks!.length - 1);
    setCurrentStackIndex(currentStackIndex + 1);
  };
  const handlePreviousStack = () => {
    if (currentStackIndex <= 0) return setCurrentStackIndex(0);
    setCurrentStackIndex(currentStackIndex - 1);
  };
  const handlePlayAgain = () => {
    setStacks([]);
    setCurrentStackIndex(0);
    setCurrentPhrase("");
    setGameState("waiting");
    socket.emit("join-room", { name: playerName, roomId });
  };
  const handleSubmit = () => {
    if (roundType === "phrase") {
      if (!phrase)
        return openNotification({ message: "You must enter a phrase" });
      setPhrase("");
      setTimeout(
        () => socket.emit("submit-card", { content: phrase, type: "phrase" }),
        555
      );
    } else {
      const dataURL = canvasReference.current!.toDataURL();
      handleClear();
      setCurrentPhrase("");
      setTimeout(
        () => socket.emit("submit-card", { content: dataURL, type: "picture" }),
        555
      );
    }
    setGameState("waiting");
  };
  const handleUndo = () => {
    const history = strokeHistory;
    history.pop();
    setStrokeHistory(history);
    const lastImage = history[history.length - 1];
    if (!lastImage) return handleClear();
    const image = new Image();
    image.src = lastImage;
    image.onload = function () {
      handleClear();
      context!.drawImage(image, 0, 0);
    };
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
              height: "100%",
              justifyContent: "space-between",
              width: 300,
            }}
          >
            <b
              style={{
                alignItems: "center",
                display: "flex",
                justifyContent: "center",
                height: "100%",
              }}
            >
              {currentPhrase}
            </b>
            <span
              style={{
                border: roundType === "picture" ? "5px groove yellow" : "none",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <canvas
                width={300}
                height={300}
                onMouseDown={(event) => handleMouseDown(event.nativeEvent)}
                onTouchStart={(event) => handleTouchStart(event.nativeEvent)}
                onMouseMove={(event) => handleMouseMove(event.nativeEvent)}
                onTouchMove={(event) => handleTouchMove(event.nativeEvent)}
                onMouseUp={handleFinishDraw}
                onTouchEnd={handleFinishDraw}
                onMouseOut={handleFinishDraw}
                onTouchCancel={handleFinishDraw}
                ref={canvasReference}
                style={{ background: "#ffffff", boxShadow: "1px 1px 2px grey" }}
              />
              <span
                style={{ display: roundType === "picture" ? "flex" : "none" }}
              >
                <Button
                  block
                  style={{ background: "pink" }}
                  onClick={() => handleClear(true)}
                >
                  Clear
                </Button>
                <Button onClick={handleUndo}>Undo</Button>
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
                border: roundType === "phrase" ? "5px groove yellow" : "none",
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
        ) : gameState === "reviewing" ? (
          <div
            style={{ background: "white", height: "100%", overflowY: "auto" }}
          >
            {stacks![currentStackIndex]!.cards.map(
              (card: Card, index: number) => (
                <div
                  style={{
                    alignItems: "center",
                    border: "1px solid black",
                    display: "flex",
                    flexDirection: "column",
                    padding: 10,
                  }}
                  key={`card-${index}`}
                >
                  <span>
                    Player:
                    <b>{card.playerName}</b>
                  </span>
                  {card.type === "phrase" ? (
                    <b>{card.content}</b>
                  ) : (
                    <img src={card.content} />
                  )}
                </div>
              )
            )}
          </div>
        ) : gameState === "finished" ? (
          <h1>Great job!</h1>
        ) : gameState === "busy" ? (
          <h1>Game is already in play</h1>
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
        ) : gameState === "reviewing" ? (
          <div style={{ display: "flex" }}>
            {currentStackIndex > 0 && (
              <Button block onClick={handlePreviousStack}>
                Previous Stack
              </Button>
            )}
            {currentStackIndex < stacks!.length - 1 ? (
              <Button block type="primary" onClick={handleNextStack}>
                Next Stack
              </Button>
            ) : (
              <Button block type="primary" onClick={handlePlayAgain}>
                Play again?
              </Button>
            )}
          </div>
        ) : (
          <></>
        )}
      </Footer>
      <Loading isLoading={isLoading} />
    </Layout>
  );
}
