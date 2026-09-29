import Landing from '../../components/myComponents/subs/landing';



const Home = () => {
  return (
    <section
      className="w-[100vw] min-h-full overflow-clip flex flex-col /relative"
    >
      <div className="relative flex md:hidden /h-[90vh] w-[100vw] /-z-10 justify-center">
      <img src="/logo.png" alt="" className="flex h-[40vh] absolute /-z-10 top-36 opacity-15 dark:opacity-5 animate-pulse" />
      </div>
      
      <div className="w-full flex flex-1 justify-center /items-center">
        <Landing />
      </div>
      {/* <Footer /> */}
      
    </section>
  )
}

export default Home
