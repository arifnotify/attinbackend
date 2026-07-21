import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model, Types } from 'mongoose';

import { Product, ProductDocument } from './schemas/product.schema';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SearchProductDto } from './dto/search-product.dto';

import { RedisService } from '../redis/redis.service';

import { formatExpiryDate } from 'src/common/utils/expiry.util';
import { getFreshTime } from 'src/common/utils/fresh-time.util';

import { SocketGateway } from 'src/socket/socket.gateway';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,

    private readonly redisService: RedisService,

    private readonly socketGateway: SocketGateway,
  ) {}

  // =========================
  // CREATE PRODUCT
  // =========================

  async create(
    createProductDto: CreateProductDto,
  ) {
    const product =
      await this.productModel.create({
        ...createProductDto,

        category:
          new Types.ObjectId(
            createProductDto.category,
          ),

        locations:
          createProductDto.locations.map(
            (id) =>
              new Types.ObjectId(id),
          ),
      });

await this.redisService.delPattern(
  'products_*',
);

    this.socketGateway.emitHomeUpdated();
    this.socketGateway.emitProductUpdated();
    this.socketGateway.emitCartUpdated();

await product.populate([
  {
    path: 'category',
  },
  {
    path: 'locations',
  },
]);
return product;
  }

  // =========================
  // GET ALL PRODUCTS
  // =========================

  async findAll(
    search?: string,
    location?: string,
  ) {
    const cacheKey =
      `products_${location || 'all'}_${
        search || ''
      }`;

    const cached =
      await this.redisService.get(
        cacheKey,
      );

    if (cached) {
      return typeof cached === 'string'
        ? JSON.parse(cached)
        : cached;
    }

    const query: any = {
      isActive: true,
    };

    if (location) {
      query.locations = {
        $in: [
          new Types.ObjectId(location),
        ],
      };
    }

    if (search) {
      query.$or = [
        {
          'title.en': {
            $regex: search,
            $options: 'i',
          },
        },
        {
          'title.bn': {
            $regex: search,
            $options: 'i',
          },
        },
        {
          'description.en': {
            $regex: search,
            $options: 'i',
          },
        },
        {
          'description.bn': {
            $regex: search,
            $options: 'i',
          },
        },
      ];
    }

    const products =
      await this.productModel
        .find(query)
        .populate('category')
        .populate('locations')
        .sort({
          createdAt: -1,
        });

    const formatted =
      products.map((product) => {
        const data: any =
          product.toObject();

        if (
          data.productType ===
          'fresh'
        ) {
          data.freshText =
            getFreshTime(
              data.updatedAt || data.createdAt,
            );
        }

        if (
          data.productType ===
            'regular' &&
          data.expiryDate
        ) {
          data.expiryText =
            `Exp: ${formatExpiryDate(
              data.expiryDate,
            )}`;
        }

        return data;
      });

    await this.redisService.set(
      cacheKey,
      JSON.stringify(formatted),
      300,
    );

    return formatted;
  }

  // =========================
  // SINGLE PRODUCT
  // =========================

  async findOne(id: string) {
    const product =
      await this.productModel
        .findById(id)
        .populate('category')
        .populate('locations');

    if (!product) {
      throw new NotFoundException(
        'Product not found',
      );
    }

    const data: any =
      product.toObject();

    if (
      data.productType ===
      'fresh'
    ) {
      data.freshText =
        getFreshTime(
          data.updatedAt || data.createdAt,
        );
    }

    if (
      data.productType ===
        'regular' &&
      data.expiryDate
    ) {
      data.expiryText =
        `Expiry: ${formatExpiryDate(
          data.expiryDate,
        )}`;
    }

    return data;
  }
  // =========================
  // UPDATE PRODUCT
  // =========================

async update(
  id: string,
  updateProductDto: UpdateProductDto,
) {
  const updateData: any = {
    ...updateProductDto,
  };

  // Category কে ObjectId বানান
  if (updateProductDto.category) {
    updateData.category = new Types.ObjectId(
      updateProductDto.category,
    );
  }

  // Locations কে ObjectId[] বানান
  if (updateProductDto.locations) {
    updateData.locations = updateProductDto.locations.map(
      (locationId) => new Types.ObjectId(locationId),
    );
  }

  const product = await this.productModel
    .findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
    .populate('category')
    .populate('locations');

  if (!product) {
    throw new NotFoundException('Product not found');
  }

  await this.redisService.delPattern('products_*',);
  await this.redisService.delPattern('cart:*');
  await this.redisService.del('admin_products');

  this.socketGateway.emitHomeUpdated();
  this.socketGateway.emitProductUpdated();
  this.socketGateway.emitCartUpdated();

  return product;
}

  // =========================
  // DELETE PRODUCT
  // =========================

// =========================
// DELETE PRODUCT
// =========================

// =========================
// DELETE PRODUCT
// =========================

async remove(id: string) {

  const product =
    await this.productModel.findById(id);


  if (!product) {

    throw new NotFoundException(
      'Product not found',
    );

  }


  await this.productModel.findByIdAndDelete(id);



  // Product cache clear
  await this.redisService.delPattern(
    'products_*',
  );


  // Cart cache clear
  await this.redisService.delPattern(
    'cart:*',
  );



  this.socketGateway.emitHomeUpdated();

  this.socketGateway.emitProductUpdated();

  this.socketGateway.emitCartUpdated();



  return {

    success:true,

    message:
    'Product deleted successfully',

  };

}

  // =========================
  // CATEGORY PRODUCTS
  // =========================

  async findByCategory(categoryId: string, location?: string) {

 const query:any={

   category:
   new Types.ObjectId(categoryId),

   isActive:true,

 };


 if(location){

   query.locations={
     $in:[
       new Types.ObjectId(location)
     ]
   };

 }



 const products =
 await this.productModel
 .find(query)
 .populate('category')
 .populate('locations')
 .sort({
   createdAt:-1
 });



 return products;

}

  // =========================
  // SEARCH PRODUCTS
  // =========================

  async searchProducts(
    searchDto: SearchProductDto,
  ) {
    const {
      keyword,
      category,
      location,
      minPrice,
      maxPrice,
      sort,
      page = '1',
      limit = '10',
    } = searchDto;

    const filter: any = {
      isActive: true,
    };

    // KEYWORD SEARCH

    if (keyword) {
      filter.$or = [
        {
          'title.en': {
            $regex: keyword,
            $options: 'i',
          },
        },
        {
          'title.bn': {
            $regex: keyword,
            $options: 'i',
          },
        },
        {
          'description.en': {
            $regex: keyword,
            $options: 'i',
          },
        },
        {
          'description.bn': {
            $regex: keyword,
            $options: 'i',
          },
        },
        {
          brand: {
            $regex: keyword,
            $options: 'i',
          },
        },
      ];
    }

    // CATEGORY FILTER

    if (category) {
      filter.category =
        new Types.ObjectId(
          category,
        );
    }

    // LOCATION FILTER

    if (location) {
      filter.locations = {
        $in: [
          new Types.ObjectId(
            location,
          ),
        ],
      };
    }

    // PRICE FILTER

    if (
      minPrice ||
      maxPrice
    ) {
      filter.price = {};

      if (minPrice) {
        filter.price.$gte =
          Number(minPrice);
      }

      if (maxPrice) {
        filter.price.$lte =
          Number(maxPrice);
      }
    }

    const currentPage =
      Number(page);

    const perPage =
      Number(limit);

    const skip =
      (currentPage - 1) *
      perPage;

    // SORT

    let sortOption: any = {
      createdAt: -1,
    };

    if (
      sort ===
      'lowToHigh'
    ) {
      sortOption = {
        price: 1,
      };
    }

    if (
      sort ===
      'highToLow'
    ) {
      sortOption = {
        price: -1,
      };
    }

    const products =
      await this.productModel
        .find(filter)
        .populate('category')
        .populate('locations')
        .sort(sortOption)
        .skip(skip)
        .limit(perPage);
        const formattedProducts =
  products.map((product) => {

    const data: any =
      product.toObject();

    if (
      data.productType ===
      'fresh'
    ) {
      data.freshText =
        getFreshTime(
          data.updatedAt || data.createdAt,
        );
    }

    if (
      data.productType ===
        'regular' &&
      data.expiryDate
    ) {
      data.expiryText =
        `Exp: ${formatExpiryDate(
          data.expiryDate,
        )}`;
    }

    return data;
  });
    
    
    const total =
      await this.productModel.countDocuments(
        filter,
      );

return {
  products: formattedProducts,

  pagination: {
    total,
    currentPage,
    totalPages:
      Math.ceil(
        total / perPage,
      ),
    perPage,
  },
};
  }

  // =========================
  // ADMIN ALL PRODUCTS
  // =========================

  async findAllAdmin() {
    const products =
      await this.productModel
        .find()
        .populate('category')
        .populate('locations')
        .sort({
          createdAt: -1,
        });

    return products;
  }
}
