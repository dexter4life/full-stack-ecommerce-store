import PgClient from '@lib/conn';
import PostgresClient from '@lib/database';
import { productQueries } from '@lib/sql';
import {
  Attribute,
  AttributeValue,
  ImageType,
  VariationOptionsType
} from '@ts-types/generated';
import { ProductType } from 'aws-sdk/clients/servicecatalog';
import { isEmpty } from 'lodash';
import type { NextApiRequest, NextApiResponse } from 'next';
import slugify from 'slugify';

class Handler extends PostgresClient {
  constructor() {
    super();
  }

  execute = async (req: NextApiRequest, res: NextApiResponse) => {
    const { method, body } = req;
    try {
      switch (method) {
        case this.POST: {
          // **** TRANSACTION ****
          try {
            PgClient.connect();
            const staff = await this.authorization(PgClient, req, res);

            await PgClient.query('BEGIN');

            const values = body;

            const slug = slugify(
              values.name.replace(/[^A-Za-z0-9\s!?]/g, '').trim()
            )?.toLowerCase();

            // ---------------- products ----------------
            const { rows } = await PgClient.query<
              ProductType,
              ProductType[keyof ProductType][]
            >(productQueries.insertProduct(), [
              slug,
              values.name,
              values.sku,
              values.salePrice,
              values.comparePrice,
              values.buyingPrice,
              values.quantity,
              values.shortDescription,
              values.description,
              values.type.id,
              values.published,
              values.disableOutOfStock,
              values.note,
              staff.id
            ]);
            const { id: productId } = rows[0];

            // ---------------- images ----------------
            // Thumbnail
            if (!isEmpty(values.thumbnail)) {
              await PgClient.query<ImageType, (string | boolean)[]>(
                productQueries.insertImage(),
                [productId, values.thumbnail?.image, true]
              );
            }

            // Gallery
            if (!isEmpty(values.gallery)) {
              for await (const { image } of values.gallery) {
                await PgClient.query<ImageType, (string | boolean)[]>(
                  productQueries.insertImage(),
                  [productId, image, false]
                );
              }
            }

            // ---------------- categories ---------------
            for await (const { id: categoryId } of values.categories) {
              await PgClient.query<unknown, string[]>(
                productQueries.insertProductCategory(),
                [productId, categoryId]
              );
            }

            // ---------------- variations ----------------
            for await (const {
              attribute,
              selectedValues
            } of values.variations) {
              const { rows } = await PgClient.query<Attribute, string[]>(
                productQueries.insertProductAttribute(),
                [productId, attribute?.id]
              );

              const productAttributeId = rows[0]?.id;

              for await (const { id: attributeValueId } of selectedValues) {
                await PgClient.query<AttributeValue, string[]>(
                  productQueries.insertProductAttributeValue(),
                  [productAttributeId, attributeValueId]
                );
              }
            }

            // ---------------- variation_options ----------------
            for await (const optValues of values.variationOptions) {
              // query image id
              const { rows: galleryRows } = await PgClient.query<
                { id: string },
                string[]
              >(productQueries.getImage(), [optValues?.image]);

              const imageId = galleryRows[0]?.id;

              // insert variant_options
              const { rows: VariantOptionsRows } = await PgClient.query<
                VariationOptionsType,
                VariationOptionsType[keyof VariationOptionsType][]
              >(productQueries.insertVariantOption(), [
                optValues?.title,
                imageId,
                productId,
                optValues?.salePrice,
                optValues?.comparePrice,
                optValues?.buyingPrice,
                optValues?.quantity,
                optValues?.sku,
                optValues?.active
              ]);

              const variantOptionId = VariantOptionsRows[0]?.id;

              const { rows: variantRows } = await PgClient.query<
                { id: string },
                string[]
              >(productQueries.insertVariant(), [
                optValues?.title,
                productId,
                variantOptionId
              ]);

              const variantId = variantRows[0]?.id;

              for await (const attributeValueId of optValues.options) {
                const { rows: AttributeValueRows } = await PgClient.query<
                  { attributeId: string },
                  string[]
                >(productQueries.getAttributeValue(), [attributeValueId]);

                const attributeId = AttributeValueRows[0]?.attributeId;

                const { rows: ProductAttributeRows } = await PgClient.query<
                  { id: string },
                  string[]
                >(productQueries.getProductAttribute(), [
                  productId,
                  attributeId
                ]);

                const productAttributeId = ProductAttributeRows[0]?.id;

                const { rows: ProductAttributeValueRows } =
                  await PgClient.query<{ id: string }, string[]>(
                    productQueries.getProductAttributeValue(),
                    [productAttributeId, attributeValueId]
                  );

                const productAttributeValueId =
                  ProductAttributeValueRows[0]?.id;

                await PgClient.query<unknown, string[]>(
                  productQueries.insertVariantValue(),
                  [variantId, productAttributeValueId]
                );
              }
            }
            await PgClient.query('COMMIT');
            return res.status(200).json({ product: rows[0] });
          } catch (error) {
            await PgClient.query('ROLLBACK');

            if (
              error?.code === '23505' &&
              error?.constraint === 'products_slug_key'
            ) {
              return res.status(500).json({
                error: {
                  type: 'PRODUCT_NAME_ALREADY_EXIST',
                  error,
                  message: error?.message,
                  from: 'createProduct'
                }
              });
            } else {
              return res.status(500).json({
                error: {
                  type: 'SERVER_ERROR',
                  error,
                  message: error?.message,
                  from: 'createProduct'
                }
              });
            }
          } finally {
            PgClient.end();
          }
        }
        default:
          res.setHeader('Allow', ['POST']);
          res.status(405).end(`There was some error!`);
      }
    } catch (error) {
      console.log('------->', error);
      res.status(500).json({
        error: {
          type: this.ErrorNames.SERVER_ERROR,
          message: error?.message,
          from: 'createProduct'
        }
      });
    }
  };
}

const { execute } = new Handler();

export default execute;
