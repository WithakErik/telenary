/*    3RD PARTY IMPORTS   */
import { Button, Input, Layout, notification } from "antd";
import { CopyOutlined, HomeOutlined, UserOutlined } from "@ant-design/icons";
import React, { useEffect, useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import socketIOClient from "socket.io-client";
/*    INTERNAL IMPORTS    */
import Loading from "./components/Loading";

/*    VARIABLES   */
const ENDPOINT = "http://localhost:5555";
const socket = socketIOClient.connect(ENDPOINT);
const { Header, Footer, Content } = Layout;
const openNotification = ({ message }: { message: string }) => {
  notification.warning({ message, duration: 4 });
};
const contentStyle = {
  background: "blue",
  overflowy: "auto",
};
const footerStyle = {
  background: "lime",
  display: "flex",
  margin: 0,
  padding: 0,
};
const headerStyle = {
  background: "red",
  display: "flex",
  justifyContent: "space-between",
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [roomId, setRoomId] = useState("");
  const [temporaryRoomId, setTemporaryRoomId] = useState("");
  const [playerCount, setPlayerCount] = useState(0);
  const [playerName, setPlayerName] = useState("");
  const [loadingMessage, setLoadingMessage] = useState("");
  const [gameState, setGameState] = useState("initial");

  useEffect(() => {
    socket.on("success", () => {
      setIsLoading(false);
    });
    socket.on("room-not-found", () =>
      openNotification({ message: "Room not found" })
    );
    socket.on("waiting-for-more-players", ({ roomId }: { roomId: string }) => {
      setIsLoading(false);
      setRoomId(roomId);
      setGameState("waiting");
    });
  }, []);
  const handleCreateRoom = () => {
    if (!playerName)
      return openNotification({ message: "You must first enter your name" });
    setIsLoading(true);
    socket && socket.emit("create-room", { name: "Withak" });
  };
  const handleJoinRoom = () => {
    if (!playerName)
      return openNotification({ message: "You must first enter your name" });
    if (!temporaryRoomId)
      return openNotification({ message: "You must first enter a room ID" });
    socket.emit("join-room", { temporaryRoomId });
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
          <b>Players:</b> {playerCount}
        </span>
      </Header>
      <Content style={contentStyle}></Content>
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
                block
                disabled={isLoading}
                onClick={handleCreateRoom}
                type="primary"
              >
                Create Room
              </Button>
              <Button block disabled={isLoading} onClick={handleJoinRoom}>
                Join Room
              </Button>
            </div>
          </>
        ) : (
          <></>
        )}
      </Footer>
      <Loading isLoading={isLoading} loadingMessage={loadingMessage} />
    </Layout>
  );
}
