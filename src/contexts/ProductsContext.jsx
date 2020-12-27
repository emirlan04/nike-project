import React, { useReducer, useState } from "react";
import axios from "axios";
import { JSON_API } from "../helpers/constants";
import { calcSubPrice, calcTotalPrice } from "../helpers/calcPrice";
// import { data } from "jquery";
import { useHistory } from "react-router-dom";

export const productsContext = React.createContext();

const INIT_STATE = {
  products: [],
  productsToEdit: null,
  productsCountInCart: JSON.parse(localStorage.getItem("cart"))
    ? JSON.parse(localStorage.getItem("cart")).products.length
    : 0,
  cartData: {},
  pageCount: 4,
  page: 1,
  productDetails: null,
  totalCount: 0,
};

const reducer = (state = INIT_STATE, action) => {
  switch (action.type) {
    case "GET_PRODUCTS":
      return { ...state, products: action.payload };
    case "ADD_PRODUCT":
      return {
        ...state,
        products: [...state.products, action.payload],
      };
    case "EDIT_PRODUCTS_DATA":
      return { ...state, productsToEdit: action.payload };

    case "ADD_AND_DELETE_CART":
      return { ...state, productsCountInCart: action.payload };
    case "GET_CART":
      return { ...state, cartData: action.payload };

    case "SAVE_PRODUCT":
      return { ...state, productsToEdit: action.payload };

    // ПАГИНАЦИЯ
    case "CET_CONTACTS_DATA":
      return { ...state, products: action.payload };
    case "CONTACTS_SET_PAGE":
      return { ...state, page: action.page };

    //DETAIL
    case "GET_PRODUCT_DETAILS":
      return { ...state, productDetails: action.payload };

    case "SET_TOTAL_COUNT":
      return { ...state, totalCount: action.payload };

    //FILTER
    case "FILTER_PRODUCTS":
      return { ...state, products: action.payload };

    default:
      return state;
  }
};

const ProductsContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, INIT_STATE);
  const [inpVal, setInpVal] = useState("");
  const history = useHistory();

  // SEARCH

  async function getProducts() {
    let params = window.location.search.replace(/%3D/g, "");
    console.log(params);
    let { data } = await axios(`${JSON_API}/products${params}`);
    dispatch({
      type: "GET_PRODUCTS",
      payload: data,
    });
  }


  const getProductsFashion = async () => {
    let params = new URLSearchParams(window.location.search);
    if (!params.get("_page")) params.set("_page", 1);
    if (!params.get("_limit")) params.set("_limit", 6);
    history.push("?" + params);
    let { data, headers } = await axios(
      `http://localhost:8000/products?${params}`
    );
    dispatch({
      type: "SET_TOTAL_COUNT",
      payload: parseInt(headers["x-total-count"]),
    });
    dispatch({
      type: "CET_CONTACTS_DATA",
      payload: data,
    });
  };

  const getProductsAdmin = async () => {
    let params = new URLSearchParams(window.location.search);
    if (!params.get("_page")) params.set("_page", 1);
    if (!params.get("_limit")) params.set("_limit", 6);
    history.push("/admin?" + params);
    let { data, headers } = await axios(
      `http://localhost:8000/products?${params}`
    );
    dispatch({
      type: "SET_TOTAL_COUNT",
      payload: parseInt(headers["x-total-count"]),
    });
    dispatch({
      type: "GET_PRODUCTS",
      payload: data,
    });
  };


  async function searchProducts() {
    let params = window.location.search.replace(/%3D/g, "");
    console.log(params);
    let { data } = await axios(`${JSON_API}/products${params}`);
    dispatch({
      type: "GET_PRODUCTS",
      payload: data,
    });
  }




  async function getProductID(id) {
    let { data } = await axios(`http://localhost:8000/products/${id}`);
    dispatch({
      type: "GET_PRODUCT_DETAILS",
      payload: data,
    });
  }

  async function addProduct(newProduct) {
    await axios.post("http://localhost:8000/products", newProduct);
    getProductsAdmin();

  }

  async function deleteContact(id) {
    await axios.delete(`http://localhost:8000/products/${id}`);
    getProductsAdmin();
  }

  async function editProduct(id) {
    const { data } = await axios.patch(`http://localhost:8000/products/${id}`);
    dispatch({
      type: "EDIT_PRODUCTS_DATA",
      payload: data,
    });
  }

  const saveProduct = async (newProduct, history) => {
    console.log(newProduct, history);
    try {
      await axios.patch(
        `http://localhost:8000/products/${newProduct.id}`,
        newProduct
      );

      dispatch({
        type: "SAVE_PRODUCT",
        payload: newProduct.id,
      });
      getProductsAdmin();

      history.push("/admin");
    } catch (error) {
      history.push("/404");
    }
  };

  // CART

  function addAndDeleteProductInCart(product) {
    let cart = JSON.parse(localStorage.getItem("cart"));

    if (!cart) {
      cart = {
        products: [],
        totalPrice: 0,
      };
    }

    let newProduct = {
      product: product,
      count: 1,
      subPrice: 0,
    };

    newProduct.subPrice = calcSubPrice(newProduct);
    console.log(newProduct);
    let newCart = cart.products.filter(
      (item) => item.product.id === product.id
    );

    if (newCart.length > 0) {
      cart.products = cart.products.filter(
        (item) => item.product.id !== product.id
      );
    } else {
      cart.products.push(newProduct);
    }

    cart.totalPrice = calcTotalPrice(cart.products);
    localStorage.setItem("cart", JSON.stringify(cart));

    dispatch({
      type: "ADD_AND_DELETE_CART",
      payload: cart.products.length,
    });
  }

  function deleteProductInCart(id){
    console.log(id)
    let cart = JSON.parse(localStorage.getItem("cart"));
    console.log(cart)
    cart.products = cart.products.filter(item => item.product.id !== id)
    console.log(cart.products)
    localStorage.setItem("cart", JSON.stringify(cart))
    getCart()
    dispatch({
      type: "ADD_AND_DELETE_CART",
      payload: cart.products.length
    })
  }


  function checkProductInCart(id) {
    let cart = JSON.parse(localStorage.getItem("cart"));
    if (!cart) {
      cart = {
        products: [],
        totalPrice: 0,
      };
    }

    let newCart = cart.products.filter((item) => item.product.id === id);
    return newCart.length > 0 ? true : false;
  }

  function getCart() {
    let cart = JSON.parse(localStorage.getItem("cart"));
    dispatch({
      type: "GET_CART",
      payload: cart,
    });
  }

  function changeCountProducts(count, id) {
    let cart = JSON.parse(localStorage.getItem("cart"));
    cart.products = cart.products.map((item) => {
      if (item.product.id === id) {
        item.count = count;
        item.subPrice = calcSubPrice(item);
      }
      return item;
    });

    cart.totalPrice = calcTotalPrice(cart.products);
    localStorage.setItem("cart", JSON.stringify(cart));
    getCart();
  }

  function makeOrder() {
    let cart = JSON.parse(localStorage.getItem("cart"));
  }

  // ПАГИНАЦИЯ

  const pageTask = async (page) => {
    const search = new URLSearchParams(window.location.search);
    search.set("_page", page);
    search.set("_limit", 3);
    history.replace(window.location.pathname + "?" + search.toString());
    getProductsFashion();
  };

  const pageAdmin = async (page) => {
    const search = new URLSearchParams(window.location.search);
    search.set("_page", page);
    search.set("_limit", 3);
    history.replace(window.location.pathname + "?" + search.toString());
    getProductsAdmin();
  };







  //SEARCH

  function search(inp_val) {
    setInpVal(inp_val);
    getProducts();
  }

  //FILTER

  async function filterProducts(value) {
    let params = "";
    params = value ? `?category=${value}` : "";
    const { data } = await axios(`${JSON_API}/products${params}`);
    dispatch({
      type: "FILTER_PRODUCTS",
      payload: data,
    });
  }

  return (
    <productsContext.Provider
      value={{
        productDetails: state.productDetails,

        page: state.page,
        products: state.products,
        productsToEdit: state.productsToEdit,
        productsCountInCart: state.productsCountInCart,
        cartData: state.cartData,


        totalCount:state.totalCount,

        deleteProductInCart,


        addAndDeleteProductInCart,
        checkProductInCart,
        changeCountProducts,
        makeOrder,
        getProducts,
        addProduct,
        deleteContact,
        editProduct,
        saveProduct,
        getCart,
        pageTask,

        search,
        getProductID,
        filterProducts,



        getProductsFashion,
        pageAdmin,
        pageTask,
        getProductsAdmin,



        searchProducts,
      


      }}
    >
      {children}
    </productsContext.Provider>
  );
};

export default ProductsContextProvider;
