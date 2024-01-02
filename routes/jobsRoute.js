const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError, NotFoundError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jobsFilterSchema = require("../schemas/jobsFilterSchema.json")

const router = new express.Router();

router.post("/", ensureAdmin, async function (req, res ,next) {
    try {
        const validator = jsonschema.validate(req.body, jobNewSchema);
        if(!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs)
        }

        const job = await Job.create(req.body);
 
        return res.status(201).json({ job })
    } catch(err) {
        return next(err)
    }
});


router.get("/", async function(req, res, next) {
    try {
        const {title, minSalary, hasEquity} = req.query;

        if(req.query.minSalary !== undefined) {
        req.query.minSalary = parseInt(req.query.minSalary)
        }

        const validator = jsonschema.validate(req.query, jobsFilterSchema);

        if(!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs)
        };

        const jobs = await Job.filter(title, minSalary, hasEquity);

        return res.json({ jobs })

    } catch(err) {
        return next(err)
    }
});

router.get("/:id", async function (req, res, next) {
    try {
        const job = await Job.getById(req.params.id)

        if(!job) {
            throw new NotFoundError(`Job with ID ${req.params.id} not found`)
        }

        return res.json({ job })
    } catch(err) {
        return next(err)
    }
})

router.patch("/:id", ensureAdmin, async function(req, res, next) {
    try {
        
        const validator = jsonschema.validate(req.body, jobUpdateSchema);
        if(!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs)
        }

        const updatedJob = await Job.update2(req.params.id, req.body);

        if (!updatedJob) {
            throw new NotFoundError(`Job with ID ${req.params.id} not found`);
        }

        return res.json({ updatedJob });

    } catch (err) {
        return next(err);
    }
});

router.delete("/:id", ensureAdmin, async function (req, res, next) {
    try {
    const deleteJob = await Job.remove(req.params.id);
    
    return res.json({deleted: deleteJob})
    } catch(err) {
        return next(err)
    }
});













module.exports = router;
