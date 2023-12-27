import { clothModel } from "../models/clothModel.js";
import { OrderModel } from "../models/orderModel.js";
import { gfs, gridfsBucket } from "../routes/web.js";
import crypto from "crypto-js";
import dotenv from "dotenv";
import os from "os";
import mongoose from "mongoose";

class SiteController {
  // dashboard page
  static homePage = async (req, res) => {
    // fetch all cloths
    try {
      let all_cloth = await clothModel.find({});
      let basics = await clothModel.find({ category: "Basics" });
      let florat = await clothModel.find({ category: "Florat" });
      let graphics = await clothModel.find({ category: "Graphics" });
      let limited = await clothModel.find({ category: "Limited" });
      console.log(all_cloth);
      res.render("admin-dashboard", {
        all: all_cloth.length,
        basics: basics.length,
        florat: florat.length,
        graphics: graphics.length,
        limited: limited.length,
      });
    } catch (error) {
      res.render("admin-dashboard", {
        all: "null",
        basics: "null",
        florat: "null",
        graphics: "null",
        limited: "null",
      });
    }
  };
  // upload page
  static uploadPage = async (req, res) => {
    res.render("upload-cloth", {});
  };
  // upload cloth
  static uploadCloth = async (req, res) => {
    console.log(req.files);
    const files = req.files;
    const {
      brand_name,
      cloth_name,
      original_price,
      discount,
      cloth_type,
      category,
      cloth_material,
      cloth_color,
      production_country,
    } = req.body;
    let images = [];
    for (let i = 0; i < files.image.length; i++) {
      // filter files data
      let imageData = {
        id: files.image[i].id,
        name: files.image[i].filename,
      };
      // add data to images array
      images.push(imageData);
    }

    try {
      const doc = new clothModel({
        brand_name: brand_name,
        cloth_name: cloth_name,
        original_price: original_price,
        discount_percent: discount,
        discounted_price: original_price - (discount / 100) * original_price,
        cloth_type: cloth_type,
        category: category,
        cloth_material: cloth_material,
        cloth_color: cloth_color,
        production_country: production_country,
        images: images,
      });

      await doc.save();
      res.redirect("/admin");
    } catch (error) {
      res.send("error");
    }
  };
  // get basics
  static getBasics = async (req, res) => {
    let basics;
    try {
      basics = await clothModel.find({ category: "Basics" });
    } catch (error) {
      basics = [];
    }
    res.render("cloth-list", { cloth: basics });
  };
  static getBasicsList = async (req, res) => {
    let basics;
    try {
      basics = await clothModel.find({ category: "Basics" });
    } catch (error) {
      basics = [];
    }
    res.send({ cloth: basics });
  };
  // get florats
  static getFlorat = async (req, res) => {
    let florat;
    try {
      florat = await clothModel.find({ category: "Florat" });
    } catch (error) {
      florat = [];
    }
    res.render("cloth-list", { cloth: florat });
  };
  static getFloratList = async (req, res) => {
    let florat;
    try {
      florat = await clothModel.find({ category: "Florat" });
    } catch (error) {
      florat = [];
    }
    res.send({ cloth: florat });
  };
  // get graphics
  static getGraphics = async (req, res) => {
    let graphics;
    try {
      graphics = await clothModel.find({ category: "Graphics" });
    } catch (error) {
      graphics = [];
    }
    res.render("cloth-list", { cloth: graphics });
  };
  static getGraphicsList = async (req, res) => {
    let graphics;
    try {
      graphics = await clothModel.find({ category: "Graphics" });
    } catch (error) {
      graphics = [];
    }
    res.send({ cloth: graphics });
  };
  // get limited
  static getLimited = async (req, res) => {
    let limited;
    try {
      limited = await clothModel.find({ category: "Limited" });
    } catch (error) {
      limited = [];
    }
    res.render("cloth-list", { cloth: limited });
  };
  static getLimitedList = async (req, res) => {
    let limited;
    try {
      limited = await clothModel.find({ category: "Limited" });
    } catch (error) {
      limited = [];
    }
    res.send({ cloth: limited });
  };
  // get all
  static getAll = async (req, res) => {
    let all;
    try {
      all = await clothModel.find({});
    } catch (error) {
      all = [];
    }
    console.log("all", all);
    res.render("cloth-list", { cloth: all });
  };
  static getAllList = async (req, res) => {
    let all;
    try {
      all = await clothModel.find({});
    } catch (error) {
      all = [];
    }
    res.send({ cloth: all });
  };
  // get image
  static getImage = async (req, res) => {
    gfs.files.findOne(
      { _id: new mongoose.mongo.ObjectId(req.params.id) },
      (err, file) => {
        if (!file || file.length === 0) {
          console.log("No file exists");
          res.send("err");
        } else {
          // console.log(file);
          const readstream = gridfsBucket.openDownloadStream(file._id);
          readstream.pipe(res);
        }
      }
    );
  };
  // delete cloth
  static deleteCloth = async (req, res) => {
    console.log(req.params.id);
    let cloth, properties;
    try {
      cloth = await clothModel.find({ _id: req.params.id });
      // console.log("user=>", user[0]);
      cloth.forEach((eachCloth) => {
        // get all image id
        for (let i = 0; i < eachCloth.images.length; i++) {
          console.log(`Image ${i + 1} id =>`, eachCloth.images[i].id);
          gridfsBucket.delete(eachCloth.images[i].id);
          console.log("deleted");
        }
      });
      await clothModel.deleteOne({ _id: cloth[0].id });
    } catch (error) {
      console.log(error);
    }
    res.redirect("/admin");
  };
  // create order
  static createOrder = async (req, res) => {
    const networkInterfaces = os.networkInterfaces();
    const acceptHeader = req.headers["accept"];
    const secretKey = process.env.SECRET_KEY;
    const algorithm = process.env.ALGORITHM;
    const cliendId = process.env.CLIENTID;

    let wifiInfo = null;

    for (const iface in networkInterfaces) {
      if (iface === "Wi-Fi") {
        const wifiInterface = networkInterfaces[iface][0];

        if (wifiInterface) {
          wifiInfo = wifiInterface;
          break;
        }
      }
    }

    const header = {
      alg: algorithm,
      clientid: cliendId,
    };

    const payload = {
      mercid: "BDMERCID",
      orderid: "order45608988",
      amount: "300.00",
      order_date: "2021-03-05T10:59:15+05:30",
      currency: "356",
      ru: "https://www.futurechaos.in",
      itemcode: "DIRECT",
      device: {
        init_channel: "internet",
        ip: wifiInfo.address,
        mac: wifiInfo.mac,
        accept_header: acceptHeader,
      },
    };

    const encodedHeader = crypto.enc.Base64.stringify(
      crypto.enc.Utf8.parse(JSON.stringify(header))
    );
    const encodedPayload = crypto.enc.Base64.stringify(
      crypto.enc.Utf8.parse(JSON.stringify(payload))
    );
    const signature = crypto.HmacSHA256(
      encodedHeader + "." + encodedPayload,
      secretKey
    );

    const base64Signature = crypto.enc.Base64.stringify(signature);
    console.log(base64Signature);
  };

  // payment response
}

export { SiteController };
