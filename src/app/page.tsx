import Head from "next/head";
import Image from "next/image";
import SplitLayout from "./components/SplitLayout";

export default function Home() {  
  return (
    <>
      <Head>
        <title>Quiz Application</title>
        <meta name="description" content="Interactive Quiz Platform" />
      </Head>
      <SplitLayout />
    </>
  )
}