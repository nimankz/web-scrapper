import Header from "../header/Header";
import Footer from "../footer/Footer";
const Layout = ({children}) => {
    return (
        <div className="d-flex flex-column justify-content-end mh-100" >
            <Header />
              <div >{children}</div>
            <Footer />
        </div>
                )
}
export default Layout;