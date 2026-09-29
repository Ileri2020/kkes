const Account = () => {
  return (
    <section
      className="w-[100vw] min-h-full overflow-clip"
    >
      <div className="w-full h-full flex flex-col items-center">
        <div className="w-full h-[60vw] max-w-[280px] max-h-[280px] rounded-full overflow-clip mb-10 mx-2 flex justify-center items-center"><img src="/placeholderMale.jpg" className="w-full" alt="" /></div>
        <div className="flex flex-col gap-2 w-full max-w-xl">
          <div className="w-full px-3">
            <div className="flex flex-row gap-3 items-center">
              <div className="w-14 h-14">icon</div>
              <div className="flex-1 flex flex-col">
                <div className="text-sm text-foreground/70">Name</div>
                <div className="text-lg font-semibold">Tobi Bola</div>
              </div>
              <div className="text-3xl text-accent" aria-hidden="true">✎</div>
            </div>
          </div>
          <div className="w-full px-3">
            <div className="flex flex-row gap-3">
              <div className="w-14 h-14">icon</div>
              <div className="flex-1">
                <div className="text-sm text-foreground/70">Username</div>
                <div className="text-lg font-semibold">Tobi246</div>
              </div>
            </div>
          </div>
          <div className="w-full px-3">
            <div className="flex flex-row gap-3">
              <div className="w-14 h-14">icon</div>
              <div className="flex-1">
                <div className="text-sm text-foreground/70">Admission no</div>
                <div className="text-lg font-semibold">849290047</div>
              </div>
            </div>
          </div>
          <div className="w-full px-3">
            <div className="flex flex-row gap-3">
              <div className="w-14 h-14">icon</div>
              <div className="flex-1">
                <div className="text-sm text-foreground/70">Email</div>
                <div className="text-lg font-semibold">tobi@gmail.com</div>
              </div>
            </div>
          </div>
          <div className="w-full px-3">
            <div className="flex flex-row gap-3">
              <div className="w-14 h-14">icon</div>
              <div className="flex-1">
                <div className="text-sm text-foreground/70">Contact</div>
                <div className="text-lg font-semibold">0849290047</div>
              </div>
            </div>
          </div>
        </div>
        <div><button type="button" className="rounded-md bg-accent/80 px-4 py-2 text-sm font-medium text-primary-foreground">Logout</button></div>
      </div>
    </section>
  )
}

export default Account
