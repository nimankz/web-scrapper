const Header = () => {
    return (
        <>
            <header className="App-header">
                <nav className="App-nav shadow-sm d-flex justify-content-center gap-2 w-100 bg-light p-3 ">
                    <button className="btn rounded-3 shadow-sm p-3 mt-3 btn-outline-secondary ">Home</button>
                    <button className="btn rounded-3 shadow-sm p-3 mt-3 btn-outline-secondary ">about</button>
                    <button className="btn rounded-3 shadow-sm p-3 mt-3 btn-outline-secondary ">insert</button>
                </nav>
            </header>
        </>
    )
}
export default Header;