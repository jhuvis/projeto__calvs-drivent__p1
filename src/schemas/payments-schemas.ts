import { Payments } from "@/protocols";
import DateExtension from '@joi/date';
import Joi from "joi";

const issuerValidationSchema = Joi.string().custom(joiIssuerValidation).required();

const joi = Joi.extend(DateExtension);
export const paymentsSchema = Joi.object<Payments>({
  ticketId: Joi.number().required(),
	cardData: {
		    issuer: issuerValidationSchema,
        number: Joi.number().min(1000).required(),
        name: Joi.string().required(),
        expirationDate: joi.date().format('MM-DD').required(), 
        cvv: Joi.number().min(1).max(999).required()
	}
});

function joiIssuerValidation(value: string, helpers: Joi.CustomHelpers<string>) {
  if (!value) return value;

  if ((value === "VISA") || (value === "MASTERCARD")) {
  }
  else
  {
    return helpers.error("any.invalid");
  }

  return value;
}
