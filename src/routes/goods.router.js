import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

// 제품 글 작성
router.post("/goods/content", authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { goodsName, imageUrl, price, content } = req.body;

    if (req.user.userType === "BUYER") {
      return res.status(400).json({ message: "글 작성 권한이 없습니다." });
    }

    await prisma.goods.create({
      data: {
        UserId: +userId,
        goodsName: goodsName,
        imageUrl: imageUrl,
        price: price,
        content: content,
      },
    });
    return res.status(201).json({ message: "게시글을 등록 하였습니다." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "서버 에러" });
  }
});

// 메인페이지 이미지 목록 조회
router.get("/goods", async (req, res, next) => {
  try {
    const Goods = await prisma.goods.findMany({
      select: {
        goodsId: true,
        goodsName: true,
        price: true,
        imageUrl: true,
        likeCount: true,
      },
    });
    return res.status(201).json({ data: Goods });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "서버 에러" });
  }
});

// 제품 글 수정
router.patch(
  "/goods/:goodsId/content",
  authMiddleware,
  async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { goodsId } = req.params;
      const { goodsName, imageUrl, price, content } = req.body;

      if (req.user.userType === "BUYER") {
        return res
          .status(400)
          .json({ message: "해당 게시글에 대한 권한이 없습니다." });
      }

      const findGoods = await prisma.goods.findFirst({
        where: { UserId: +userId, goodsId: +goodsId },
      });

      await prisma.goods.update({
        where: { UserId: +userId, goodsId: +goodsId },
        data: {
          goodsName: goodsName,
          imageUrl: imageUrl,
          price: price,
          content: content,
        },
      });
      return res.status(201).json({ message: "수정이 완료 되었습니다." });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "서버 에러" });
    }
  }
);

// 제품 글 삭제
router.delete(
  "/goods/:goodsId/content",
  authMiddleware,
  async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { goodsId } = req.params;

      if (req.user.userType === "BUYER") {
        return res.status(400).json({ message: "권한이 없습니다." });
      }

      const existsGoods = await prisma.goods.findFirst({
        where: { UserId: +userId, goodsId: +goodsId },
      });
      if (!existsGoods) {
        return res.status(401).json({ message: "상품이 존재하지 않습니다." });
      }

      await prisma.goods.delete({
        where: { UserId: +userId, goodsId: +goodsId },
      });
      return res.status(201).json({ message: "삭제가 완료 되었습니다." });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "서버 에러" });
    }
  }
);

// 상세 정보 글 조회
router.get("/goods/:goodsId", async (req, res, next) => {
  try {
    const { goodsId } = req.params;

    const Goods = await prisma.goods.findFirst({
      where: { goodsId: +goodsId },
      select: {
        goodsName: true,
        price: true,
        imageUrl: true,
        content: true,
        Comments: {
          select: {
            comment: true,
          },
        },
      },
    });

    return res.status(201).json({ data: Goods });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "서버 에러" });
  }
});

router.post("/goods/:goodsId/like", authMiddleware, async (req, res, next) => {
  try {
    const { goodsId } = req.params;
    const { userId } = req.user;

    let isLike = await prisma.likes.findFirst({
      where: { GoodsId: +goodsId, UserId: +userId },
    });

    if (!isLike) {
      await prisma.likes.create({
        data: {
          GoodsId: +goodsId,
          UserId: +userId,
        },
      });

      await prisma.goods.update({
        where: { goodsId: +goodsId },
        data: {
          likeCount: {
            increment: 1,
          },
        },
      });
      return res
        .status(200)
        .json({ message: "게시글의 좋아요를 등록하였습니다." });
    } else {
      await prisma.likes.delete({ where: { likeId: +isLike.likeId } });

      await prisma.goods.update({
        where: { goodsId: +goodsId },
        data: {
          likeCount: {
            decrement: 1,
          },
        },
      });
      return res
        .status(200)
        .json({ message: "게시글의 좋아요를 취소하였습니다." });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "서버 오류" });
  }
});

export default router;
